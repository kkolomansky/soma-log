// Publiczne API SomaLog — 3 endpointy sterowane osobistym tokenem (per użytkownik):
//   POST /functions/v1/api/entries          → dodaj/scal wpis (domyślnie na dziś)
//   GET  /functions/v1/api/entries?date=…    → odczyt wpisu dnia
//   POST /functions/v1/api/ask               → bezstanowe pytanie do Logana (JSON)
//
// Autoryzacja: nagłówek `Authorization: Bearer <token>` (osobisty token API, nie JWT).
// Token to nie JWT, więc funkcja musi mieć verify_jwt=false, a klient jest service-role.
// UWAGA BEZPIECZEŃSTWA: service-role omija RLS — KAŻDE zapytanie filtrujemy ręcznie po user_id.
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  CORS,
  json,
  METRICS,
  formatEntry,
  PERSONA,
  XAI_API_KEY,
  runGetEntries,
  callXai,
} from "../_shared/logan.ts";

const METRIC_KEYS = METRICS.map((m) => m.key);

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

// „Dziś" w strefie Europe/Warsaw — spójnie z aplikacją i domyślną wartością entry_date w bazie.
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(new Date());
const isValidDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isValidMetric = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100;

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Wyznacza user_id z osobistego tokenu API. Zwraca null gdy brak/nieprawidłowy/odwołany.
async function authUser(req: Request): Promise<string | null> {
  const h = req.headers.get("Authorization") ?? "";
  const token = h.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;
  const hash = await sha256Hex(token);
  const { data, error } = await admin
    .from("soma_api_tokens")
    .select("id, user_id, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;
  // best-effort — nie blokujemy odpowiedzi na aktualizacji znacznika użycia
  admin
    .from("soma_api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {}, () => {});
  return data.user_id as string;
}

// Segment ścieżki po nazwie funkcji `api` (np. "entries", "ask").
function subPath(req: Request): string {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idx = parts.lastIndexOf("api");
  return idx >= 0 ? parts.slice(idx + 1).join("/") : parts[parts.length - 1] ?? "";
}

// POST /entries — dodaj/scal wpis. Aktualizujemy tylko podane pola (reszta bez zmian).
async function handleCreateEntry(req: Request, userId: string) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Nieprawidłowy JSON" }, 400);
  }

  const date = body.date ?? today();
  if (!isValidDate(date)) return json({ error: "Nieprawidłowa data (oczekiwano YYYY-MM-DD)" }, 400);

  const updates: Record<string, unknown> = {};
  for (const key of METRIC_KEYS) {
    if (body[key] === undefined || body[key] === null) continue;
    if (!isValidMetric(body[key])) {
      return json({ error: `Parametr '${key}' musi być liczbą całkowitą 0–100` }, 400);
    }
    updates[key] = body[key];
  }
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== "string") return json({ error: "'note' musi być tekstem" }, 400);
    updates.note = body.note;
  }
  if (Object.keys(updates).length === 0) {
    return json({ error: "Podaj co najmniej jeden parametr (0–100) lub note" }, 400);
  }

  const { data: existing, error: selErr } = await admin
    .from("soma_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();
  if (selErr) return json({ error: selErr.message }, 400);

  let query;
  if (existing) {
    // Scalanie: aktualizujemy tylko podane pola, resztę zostawiamy.
    query = admin.from("soma_entries").update(updates).eq("user_id", userId).eq("entry_date", date);
  } else {
    // Nowy wpis: kolumny metryk są NOT NULL, więc brakujące dopełniamy neutralną wartością 50.
    const insertRow: Record<string, unknown> = { user_id: userId, entry_date: date, ...updates };
    for (const key of METRIC_KEYS) if (insertRow[key] === undefined) insertRow[key] = 50;
    query = admin.from("soma_entries").insert(insertRow);
  }

  const { data: entry, error } = await query.select().single();
  if (error) return json({ error: error.message }, 400);
  return json({ entry });
}

// GET /entries?date=YYYY-MM-DD — odczyt wpisu dnia (domyślnie dziś).
async function handleGetEntry(req: Request, userId: string) {
  const date = new URL(req.url).searchParams.get("date") ?? today();
  if (!isValidDate(date)) return json({ error: "Nieprawidłowa data (oczekiwano YYYY-MM-DD)" }, 400);
  const { data: entry, error } = await admin
    .from("soma_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();
  if (error) return json({ error: error.message }, 400);
  return json({ entry: entry ?? null });
}

// POST /ask — bezstanowe pytanie do Logana; wpis wskazanego dnia jako kontekst. Nic nie zapisuje.
async function handleAsk(req: Request, userId: string) {
  if (!XAI_API_KEY) return json({ error: "Brak konfiguracji XAI_API_KEY" }, 500);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Nieprawidłowy JSON" }, 400);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return json({ error: "Brak pytania (pole 'question')" }, 400);

  const date = body.date ?? today();
  if (!isValidDate(date)) return json({ error: "Nieprawidłowa data (oczekiwano YYYY-MM-DD)" }, 400);

  const { data: entry } = await admin
    .from("soma_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();

  const messages: unknown[] = [
    {
      role: "system",
      content: `${PERSONA}\n\n=== Wpis z dnia ${date} (kontekst) ===\n${formatEntry(entry)}`,
    },
    { role: "user", content: question },
  ];

  for (let i = 0; i < 5; i++) {
    const res = await callXai(messages, false, 2000);
    if (!res.ok) return json({ error: `Błąd xAI: ${res.status} ${await res.text()}` }, 502);
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) return json({ error: "Pusta odpowiedź modelu" }, 502);
    const toolCalls = msg.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      const answer = (msg.content ?? "").trim();
      if (!answer) return json({ error: "Logan nie zwrócił odpowiedzi. Spróbuj ponownie." }, 502);
      return json({ answer, entryDate: date });
    }
    messages.push(msg);
    for (const call of toolCalls) {
      const result = call.function?.name === "get_entries"
        ? await runGetEntries(admin, call.function.arguments, userId)
        : { error: "Nieznane narzędzie" };
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return json({ error: "Przekroczono limit kroków agenta" }, 504);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "Brak konfiguracji SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }

  const userId = await authUser(req);
  if (!userId) return json({ error: "Nieprawidłowy lub brakujący token" }, 401);

  const sub = subPath(req);
  if (sub === "entries") {
    if (req.method === "POST") return handleCreateEntry(req, userId);
    if (req.method === "GET") return handleGetEntry(req, userId);
    return json({ error: "Method not allowed" }, 405);
  }
  if (sub === "ask") {
    if (req.method === "POST") return handleAsk(req, userId);
    return json({ error: "Method not allowed" }, 405);
  }
  return json({ error: "Nieznana ścieżka. Użyj /entries lub /ask" }, 404);
});
