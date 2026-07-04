// Współdzielona logika agenta Logana — używana przez funkcje `agent` (czat/analiza)
// oraz `api` (bezstanowe zapytanie przez token). Trzymamy tu personę, listę metryk,
// definicję narzędzia get_entries i wywołanie xAI, żeby nie duplikować promptu.
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
export const XAI_URL = "https://api.x.ai/v1/chat/completions";
export const MODEL = "grok-4-1-fast-reasoning";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

export const METRICS = [
  { key: "sleep", label: "Sen", higherBetter: true },
  { key: "energy", label: "Energia", higherBetter: true },
  { key: "motivation", label: "Motywacja", higherBetter: true },
  { key: "fatigue", label: "Zmęczenie", higherBetter: false },
  { key: "doms", label: "Bolesność mięśni (DOMS)", higherBetter: false },
  { key: "stress", label: "Stres", higherBetter: false },
];

export function formatEntry(e: Record<string, unknown> | null) {
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

export const PERSONA = `Nazywasz się Logan — jesteś ekspertem od regeneracji i wydolności w aplikacji SomaLog. Łączysz kompetencje trenera personalnego najwyższej klasy z wiedzą z zakresu medycyny sportowej, fizjologii wysiłku i osteopatii. Mówisz po polsku, rzeczowo, ciepło i konkretnie. Twoje zadanie: na podstawie dziennych parametrów (sen, energia, motywacja, zmęczenie, bolesność DOMS, stres; skala 0–100) oraz subiektywnych notatek oceniać stan użytkownika, wykrywać ryzyko przetrenowania, oceniać jakość regeneracji i podpowiadać konkretne działania poprawiające poszczególne parametry.

Zasady:
- Pamiętaj o kierunku skali: dla snu/energii/motywacji wyższa wartość jest lepsza; dla zmęczenia/bolesności/stresu niższa jest lepsza.
- Gdy potrzebujesz porównać dni lub wychwycić trend (np. narastające zmęczenie, spadek snu), użyj narzędzia get_entries, aby pobrać wcześniejsze wpisy. Nie zgaduj historii — sprawdź ją.
- Łącz sygnały: utrzymujące się wysokie zmęczenie/DOMS/stres przy spadku snu i motywacji to czerwone flagi przetrenowania; dobre wartości i stabilny trend → można utrzymać obciążenie.
- Dawaj 1–3 konkretne, wykonalne wskazówki, nie ogólniki.
- Jesteś wsparciem treningowym, nie stawiasz diagnoz medycznych. Przy niepokojących objawach zalecaj kontakt ze specjalistą.`;

export const TOOLS = [
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

// Wykonanie narzędzia get_entries. `userId` opcjonalny: pod RLS (funkcja `agent`) można go
// pominąć; przy kliencie service-role (funkcja `api`) MUSI być podany, bo RLS jest omijane.
export async function runGetEntries(
  supabase: SupabaseClient,
  argsRaw: string,
  userId?: string,
) {
  try {
    const args = JSON.parse(argsRaw || "{}");
    let q = supabase
      .from("soma_entries")
      .select("entry_date, sleep, energy, motivation, fatigue, doms, stress, note")
      .gte("entry_date", args.from)
      .lte("entry_date", args.to)
      .order("entry_date", { ascending: true });
    if (userId) q = q.eq("user_id", userId);
    const { data: rows, error } = await q;
    return error ? { error: error.message } : { entries: rows };
  } catch (e) {
    return { error: String(e) };
  }
}

export function callXai(messages: unknown[], stream: boolean, maxTokens?: number) {
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
