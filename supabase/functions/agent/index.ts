// Agent AI SomaLog (Logan) — trener z zapleczem lekarskim/osteopatycznym.
// Tryb chat: odpowiedź STRUMIENIOWA (słowo po słowie, SSE od xAI → text/plain do klienta).
// Tryb summary: JSON { reply, short }. Otwarty dzień w kontekście; pozostałe dni przez get_entries.
import { createClient } from "jsr:@supabase/supabase-js@2";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4-1-fast-reasoning";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const METRICS = [
  { key: "sleep", label: "Sen", higherBetter: true },
  { key: "energy", label: "Energia", higherBetter: true },
  { key: "motivation", label: "Motywacja", higherBetter: true },
  { key: "fatigue", label: "Zmęczenie", higherBetter: false },
  { key: "doms", label: "Bolesność mięśni (DOMS)", higherBetter: false },
  { key: "stress", label: "Stres", higherBetter: false },
];

function formatEntry(e) {
  if (!e) return "Brak wpisu na ten dzień (parametry nieuzupełnione).";
  const lines = METRICS.map((m) => {
    const v = e[m.key];
    const dir = m.higherBetter ? "wyżej = lepiej" : "niżej = lepiej";
    return `- ${m.label}: ${v ?? "—"}/100 (${dir})`;
  });
  const note =
    typeof e.note === "string" && e.note.trim()
      ? `\nNotatka użytkownika: „${e.note.trim()}"`
      : "\nNotatka: (brak)";
  return lines.join("\n") + note;
}

const PERSONA = `Nazywasz się Logan — jesteś ekspertem od regeneracji i wydolności w aplikacji SomaLog. Łączysz kompetencje trenera personalnego najwyższej klasy z wiedzą z zakresu medycyny sportowej, fizjologii wysiłku i osteopatii. Mówisz po polsku, rzeczowo, ciepło i konkretnie. Twoje zadanie: na podstawie dziennych parametrów (sen, energia, motywacja, zmęczenie, bolesność DOMS, stres; skala 0–100) oraz subiektywnych notatek oceniać stan użytkownika, wykrywać ryzyko przetrenowania, oceniać jakość regeneracji i podpowiadać konkretne działania poprawiające poszczególne parametry.

Zasady:
- Pamiętaj o kierunku skali: dla snu/energii/motywacji wyższa wartość jest lepsza; dla zmęczenia/bolesności/stresu niższa jest lepsza.
- Gdy potrzebujesz porównać dni lub wychwycić trend (np. narastające zmęczenie, spadek snu), użyj narzędzia get_entries, aby pobrać wcześniejsze wpisy. Nie zgaduj historii — sprawdź ją.
- Łącz sygnały: utrzymujące się wysokie zmęczenie/DOMS/stres przy spadku snu i motywacji to czerwone flagi przetrenowania; dobre wartości i stabilny trend → można utrzymać obciążenie.
- Dawaj 1–3 konkretne, wykonalne wskazówki, nie ogólniki.
- Jesteś wsparciem treningowym, nie stawiasz diagnoz medycznych. Przy niepokojących objawach zalecaj kontakt ze specjalistą.`;

const SUMMARY_INSTRUCTION = `Tryb: ANALIZA LOGANA (rozbudowane podsumowanie dnia). Przygotuj wnikliwą, rozbudowaną analizę stanu użytkownika na podstawie parametrów tego dnia, notatki ORAZ — jeśli została dołączona — rozmowy z tego dnia. Wykorzystaj narzędzie get_entries, aby porównać kilka ostatnich dni i ocenić trend (regeneracja vs narastające zmęczenie/ryzyko przetrenowania). Struktura: 3–5 akapitów — (1) ogólna ocena stanu i regeneracji, (2) interpretacja poszczególnych parametrów i ich zmian w czasie, (3) ryzyka (np. przetrenowanie) i sygnały ostrzegawcze, (4) konkretne, wykonalne zalecenia na najbliższe dni. Pisz po polsku, pełnymi zdaniami, bez nagłówków markdown.

WAŻNE — format odpowiedzi: pierwsza linia to dokładnie "SKRÓT: " + jedno zwięzłe zdanie (max ~140 znaków) podsumowujące najważniejszy wniosek; potem pusta linia; potem pełna, rozbudowana analiza.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_entries",
      description:
        "Pobiera wcześniejsze wpisy użytkownika (parametry 0–100 i notatki) z zakresu dat, aby ocenić trendy i regenerację.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Data początkowa YYYY-MM-DD (włącznie)" },
          to: { type: "string", description: "Data końcowa YYYY-MM-DD (włącznie)" },
        },
        required: ["from", "to"],
      },
    },
  },
];

// Wykonanie narzędzia get_entries pod RLS użytkownika.
async function runGetEntries(supabase, argsRaw) {
  try {
    const args = JSON.parse(argsRaw || "{}");
    const { data: rows, error } = await supabase
      .from("soma_entries")
      .select("entry_date, sleep, energy, motivation, fatigue, doms, stress, note")
      .gte("entry_date", args.from)
      .lte("entry_date", args.to)
      .order("entry_date", { ascending: true });
    return error ? { error: error.message } : { entries: rows };
  } catch (e) {
    return { error: String(e) };
  }
}

function callXai(messages, stream, maxTokens) {
  return fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.4,
      stream: !!stream,
      // Budżet na pełną analizę — model reasoning bez limitu potrafi zwrócić pustą treść.
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!XAI_API_KEY) return json({ error: "Brak konfiguracji XAI_API_KEY" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Brak autoryzacji" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: authHeader } } },
  );

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Nieprawidłowy JSON" }, 400);
  }

  const entryDate = body.entryDate;
  const mode = body.mode === "summary" ? "summary" : "chat";
  const history = Array.isArray(body.history) ? body.history : [];
  if (!entryDate) return json({ error: "Brak entryDate" }, 400);

  const { data: todayEntry, error: todayErr } = await supabase
    .from("soma_entries")
    .select("*")
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (todayErr) return json({ error: todayErr.message }, 400);

  const systemContent =
    `${PERSONA}\n\n=== Wpis z dnia ${entryDate} (kontekst otwartego dnia) ===\n` +
    `${formatEntry(todayEntry)}`;

  const messages = [{ role: "system", content: systemContent }];

  if (mode === "summary") {
    messages.push({ role: "system", content: SUMMARY_INSTRUCTION });
    const { data: chat } = await supabase
      .from("soma_chat_messages")
      .select("role, content")
      .eq("entry_date", entryDate)
      .order("created_at", { ascending: true });
    if (chat && chat.length) {
      const transcript = chat
        .map((m) => `${m.role === "assistant" ? "Logan" : "Użytkownik"}: ${m.content}`)
        .join("\n");
      messages.push({
        role: "system",
        content: `=== Rozmowa z tego dnia (kontekst do analizy) ===\n${transcript}`,
      });
    }
    messages.push({ role: "user", content: `Przygotuj analizę mojego stanu z dnia ${entryDate}.` });

    // Pętla nie-strumieniowa → JSON { reply, short }.
    for (let i = 0; i < 5; i++) {
      const res = await callXai(messages, false, 2000);
      if (!res.ok) return json({ error: `Błąd xAI: ${res.status} ${await res.text()}` }, 502);
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) return json({ error: "Pusta odpowiedź modelu" }, 502);
      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        const content = (msg.content ?? "").trim();
        // Brak treści (np. model zużył budżet na reasoning) — zgłoś błąd zamiast cichego pustego sukcesu.
        if (!content) return json({ error: "Logan nie zwrócił analizy. Spróbuj ponownie." }, 502);
        const m = content.match(/^\s*SKR[ÓO]T:\s*(.+?)\s*(?:\n|$)/i);
        const short = m ? m[1].trim() : content.split(/\n/)[0].slice(0, 160).trim();
        const full = m ? content.slice(m[0].length).trim() : content;
        return json({ reply: full || content, short });
      }
      messages.push(msg);
      for (const call of toolCalls) {
        const result = call.function?.name === "get_entries"
          ? await runGetEntries(supabase, call.function.arguments)
          : { error: "Nieznane narzędzie" };
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
    return json({ error: "Przekroczono limit kroków agenta" }, 504);
  }

  // ── Tryb chat: strumień tekstu (SSE od xAI → text/plain deltas do klienta) ──
  for (const m of history) {
    if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
      messages.push({ role: m.role, content: m.content });
    }
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < 5; i++) {
          const res = await callXai(messages, true);
          if (!res.ok || !res.body) {
            controller.enqueue(enc.encode(`\n[Błąd Logana: ${res.status}]`));
            break;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          const toolCalls = [];
          const assistantMsg = { role: "assistant", content: "" };
          let sawTool = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const data = t.slice(5).trim();
              if (data === "[DONE]" || !data) continue;
              let parsed;
              try { parsed = JSON.parse(data); } catch { continue; }
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;
              if (typeof delta.content === "string" && delta.content) {
                assistantMsg.content += delta.content;
                controller.enqueue(enc.encode(delta.content));
              }
              if (Array.isArray(delta.tool_calls)) {
                sawTool = true;
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  toolCalls[idx] = toolCalls[idx] || { id: "", type: "function", function: { name: "", arguments: "" } };
                  if (tc.id) toolCalls[idx].id = tc.id;
                  if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
              }
            }
          }

          if (sawTool && toolCalls.length) {
            assistantMsg.tool_calls = toolCalls.filter(Boolean);
            messages.push(assistantMsg);
            for (const call of assistantMsg.tool_calls) {
              const result = call.function?.name === "get_entries"
                ? await runGetEntries(supabase, call.function.arguments)
                : { error: "Nieznane narzędzie" };
              messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
            }
            continue; // kolejna tura → strumień finalnej odpowiedzi
          }
          break; // finalna odpowiedź już wysłana strumieniem
        }
      } catch (e) {
        controller.enqueue(enc.encode(`\n[Błąd Logana: ${e}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
  });
});
