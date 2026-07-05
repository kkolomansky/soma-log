// Agent AI SomaLog (Logan) — trener z zapleczem lekarskim/osteopatycznym.
// Tryb chat: odpowiedź STRUMIENIOWA (słowo po słowie, SSE od xAI → text/plain do klienta).
// Tryb summary: JSON { reply, short }. Otwarty dzień w kontekście; pozostałe dni przez get_entries.
// Persona, metryki, narzędzie get_entries i wywołanie xAI są współdzielone z funkcją `api`.
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  CORS,
  json,
  formatEntry,
  PERSONA,
  XAI_API_KEY,
  runGetEntries,
  callXai,
  enforceRateLimit,
} from "../_shared/logan.ts";

const SUMMARY_INSTRUCTION = `Tryb: ANALIZA LOGANA (rozbudowane podsumowanie dnia). Przygotuj wnikliwą, rozbudowaną analizę stanu użytkownika na podstawie parametrów tego dnia, notatki ORAZ — jeśli została dołączona — rozmowy z tego dnia. Wykorzystaj narzędzie get_entries, aby porównać kilka ostatnich dni i ocenić trend (regeneracja vs narastające zmęczenie/ryzyko przetrenowania). Struktura: 3–5 akapitów — (1) ogólna ocena stanu i regeneracji, (2) interpretacja poszczególnych parametrów i ich zmian w czasie, (3) ryzyka (np. przetrenowanie) i sygnały ostrzegawcze, (4) konkretne, wykonalne zalecenia na najbliższe dni. Pisz po polsku, pełnymi zdaniami, bez nagłówków markdown.

WAŻNE — format odpowiedzi: pierwsza linia to dokładnie "SKRÓT: " + jedno zwięzłe zdanie (max ~140 znaków) podsumowujące najważniejszy wniosek; potem pusta linia; potem pełna, rozbudowana analiza.`;

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

  // Rate limit — klient JWT, więc user_id wyznacza RPC z auth.uid(). Wspólny licznik z /ask.
  const limited = await enforceRateLimit(supabase);
  if (limited) return limited;

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
