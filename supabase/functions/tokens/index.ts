// Zarządzanie osobistymi tokenami API SomaLog — wołane z aplikacji pod JWT użytkownika
// (RLS: użytkownik operuje tylko na własnych tokenach). Plaintext tokenu zwracamy raz,
// przy tworzeniu; w bazie trzymamy wyłącznie jego SHA-256 hash.
//   POST   { name? }  → utwórz token (zwraca plaintext raz)
//   GET               → lista własnych tokenów (metadane, bez plaintextu)
//   DELETE { id }     → odwołaj (usuń) token
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Brak autoryzacji" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Nieprawidłowa sesja" }, 401);

  // Utwórz token
  if (req.method === "POST") {
    let name: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.name === "string" && body.name.trim()) name = body.name.trim().slice(0, 80);
    } catch { /* body opcjonalne */ }

    const raw = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const token = `somalog_${raw}`;
    const token_prefix = `somalog_${raw.slice(0, 8)}`;
    const token_hash = await sha256Hex(token);

    const { data, error } = await supabase
      .from("soma_api_tokens")
      .insert({ user_id: user.id, name, token_prefix, token_hash })
      .select("id, name, token_prefix, created_at")
      .single();
    if (error) return json({ error: error.message }, 400);
    // Plaintext zwracany TYLKO teraz — potem już niedostępny.
    return json({ token, ...data });
  }

  // Lista tokenów (bez plaintextu)
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("soma_api_tokens")
      .select("id, name, token_prefix, created_at, last_used_at")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 400);
    return json({ tokens: data ?? [] });
  }

  // Odwołanie tokenu (twarde usunięcie — RLS pilnuje właściciela)
  if (req.method === "DELETE") {
    let id: string | undefined;
    try {
      id = (await req.json())?.id;
    } catch { /* ignore */ }
    if (!id) return json({ error: "Brak id tokenu" }, 400);
    const { error } = await supabase.from("soma_api_tokens").delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
