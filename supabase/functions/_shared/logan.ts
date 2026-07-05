// Współdzielona logika agenta Logana — używana przez funkcje `agent` (czat/analiza)
// oraz `api` (bezstanowe zapytanie przez token). Trzymamy tu personę, listę metryk,
// definicję narzędzia get_entries i wywołanie xAI, żeby nie duplikować promptu.
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
export const XAI_URL = "https://api.x.ai/v1/chat/completions";
export const MODEL = "grok-4-1-fast-reasoning";

// OpenAI — embeddingi do wyszukiwania semantycznego (ten sam model co backfill kolumny embedding).
export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
export const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
export const EMBED_MODEL = "text-embedding-3-small";

// Dzienny limit zapytań do Logana per użytkownik (wspólny dla /ask, MCP i webowego czatu/analizy).
export const LOGAN_DAILY_LIMIT = Number(Deno.env.get("LOGAN_DAILY_LIMIT") ?? "10");

// Parametry retrievalu hybrydowego (top-N na każde źródło + okno „ostatnich dni").
export const HYBRID_MATCH_COUNT = Number(Deno.env.get("HYBRID_MATCH_COUNT") ?? "30");
export const HYBRID_RECENT_DAYS = Number(Deno.env.get("HYBRID_RECENT_DAYS") ?? "7");

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

// Egzekwuje dzienny limit zapytań do Logana. Zwraca null gdy w limicie, albo gotową odpowiedź 429.
// `userId` podaj przy kliencie service-role (funkcja `api`); przy kliencie JWT (funkcja `agent`)
// pomiń — RPC odczyta auth.uid(). Fail-open: przy błędzie licznika nie blokujemy zapytania.
export async function enforceRateLimit(
  client: SupabaseClient,
  userId?: string,
): Promise<Response | null> {
  const { data, error } = await client.rpc("soma_ai_rate_limit", {
    p_limit: LOGAN_DAILY_LIMIT,
    p_user_id: userId ?? null,
  });
  if (error || !data || data.allowed) return null;

  const resetAt = data.reset_at as string | undefined;
  const retryAfter = resetAt
    ? Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000))
    : undefined;
  return new Response(
    JSON.stringify({
      error: `Przekroczono dzienny limit zapytań do Logana (${data.limit}/dzień). Spróbuj ponownie jutro.`,
      limit: data.limit,
      count: data.count,
      resetAt: resetAt ?? null,
    }),
    {
      status: 429,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
      },
    },
  );
}

// Kanoniczny kompozyt do embeddingu wpisu: data + 6 metryk + notatka. TEN SAM format musi być
// użyty przy embedowaniu nowych wpisów (funkcja embed-entry) i przy re-backfillu, żeby wektory
// starych i nowych wpisów żyły w spójnej przestrzeni.
export function buildEmbeddingInput(e: Record<string, unknown>): string {
  const lines = METRICS.map((m) => `${m.label}: ${e[m.key] ?? "—"}/100`);
  const note = typeof e.note === "string" && e.note.trim() ? e.note.trim() : "(brak)";
  return `Data: ${e.entry_date ?? "—"}\n${lines.join("\n")}\nNotatka: ${note}`;
}

// Embedding tekstu modelem OpenAI (zapytanie użytkownika albo kompozyt wpisu). Fail-open: przy
// braku klucza/awarii zwraca null → retrieval hybrydowy leci dalej bez części wektorowej.
export async function embedText(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY || !text.trim()) return null;
  try {
    const res = await fetch(OPENAI_EMBED_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const vec = data?.data?.[0]?.embedding;
    return Array.isArray(vec) ? vec : null;
  } catch {
    return null;
  }
}

// Buduje blok kontekstu RAG dla Logana: wynik wyszukiwania hybrydowego (wektor top-N ∪ text top-N)
// scalony z „ostatnimi N dniami". `userId` podaj przy kliencie service-role (funkcja `api`);
// przy kliencie JWT (funkcja `agent`) pomiń — RPC odczyta auth.uid(). Pusty string, gdy brak wyników.
export async function hybridContext(
  client: SupabaseClient,
  opts: { query: string; referenceDate: string; userId?: string },
): Promise<string> {
  const embedding = await embedText(opts.query);
  const { data: rows, error } = await client.rpc("hybrid_search_soma_entries", {
    query_embedding: embedding,
    query_text: opts.query,
    match_count: HYBRID_MATCH_COUNT,
    recent_days: HYBRID_RECENT_DAYS,
    reference_date: opts.referenceDate,
    ...(opts.userId ? { filter_user_id: opts.userId } : {}),
  });
  if (error || !Array.isArray(rows) || rows.length === 0) return "";

  const render = (e: Record<string, unknown>) => `[${e.entry_date}]\n${formatEntry(e)}`;
  const recent = rows.filter((r) => r.is_recent).map(render);
  const matched = rows.filter((r) => !r.is_recent).map(render);

  const parts: string[] = [];
  if (recent.length) {
    parts.push(`=== Ostatnie ${HYBRID_RECENT_DAYS} dni (zawsze dołączane) ===\n${recent.join("\n\n")}`);
  }
  if (matched.length) {
    parts.push(
      `=== Pasujące wpisy z historii (wyszukiwanie hybrydowe: semantyka + słowa kluczowe) ===\n${matched.join("\n\n")}`,
    );
  }
  return parts.join("\n\n");
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
