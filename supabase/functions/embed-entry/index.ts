// Auto-embedding wpisu SomaLog. Wołana przez trigger bazy (pg_net) po insert/update kolumn treści
// (note + 6 metryk). Liczy embedding OpenAI z kanonicznego kompozytu i zapisuje go do kolumny
// `embedding`. Aktualizujemy TYLKO tę kolumnę — trigger nasłuchuje kolumn treści, więc nie ma pętli.
//
// verify_jwt=false (wołane z bazy, nie przez JWT). Autoryzacja: nagłówek x-embed-secret jest
// weryfikowany przez RPC public.verify_embed_secret (porównuje z sekretem z Vault w bazie) —
// dzięki temu nie trzeba ustawiać sekretu po stronie funkcji, cała konfiguracja żyje w Vault.
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  CORS,
  json,
  buildEmbeddingInput,
  embedText,
  OPENAI_API_KEY,
} from "../_shared/logan.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!OPENAI_API_KEY) return json({ error: "Brak konfiguracji OPENAI_API_KEY" }, 500);
  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "Brak konfiguracji SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }
  // Sekret współdzielony z triggerem (z Vault) — odcina publiczne wywołania (verify_jwt=false).
  // Weryfikacja po stronie bazy: RPC porównuje nagłówek z sekretem, nie zwracając go na zewnątrz.
  const { data: authorized, error: authErr } =
    await admin.rpc("verify_embed_secret", { candidate: req.headers.get("x-embed-secret") ?? "" });
  if (authErr || authorized !== true) {
    return json({ error: "Nieautoryzowane" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Nieprawidłowy JSON" }, 400);
  }
  // Trigger wysyła { id }; akceptujemy też pełny payload webhooka ({ record: { id } }).
  const id = (body.id ?? (body.record as Record<string, unknown> | undefined)?.id) as string | undefined;
  if (!id) return json({ error: "Brak id wpisu" }, 400);

  const { data: entry, error: selErr } = await admin
    .from("soma_entries")
    .select("id, entry_date, sleep, energy, motivation, fatigue, doms, stress, note")
    .eq("id", id)
    .maybeSingle();
  if (selErr) return json({ error: selErr.message }, 400);
  if (!entry) return json({ error: "Wpis nie istnieje" }, 404);

  const embedding = await embedText(buildEmbeddingInput(entry));
  if (!embedding) return json({ error: "Nie udało się policzyć embeddingu" }, 502);

  const { error: updErr } = await admin
    .from("soma_entries")
    .update({ embedding })
    .eq("id", id);
  if (updErr) return json({ error: updErr.message }, 400);

  return json({ ok: true, id });
});
