// Usunięcie własnego konta SomaLog. Wołane z aplikacji pod JWT użytkownika.
// Weryfikujemy tożsamość zwykłym klientem (JWT), a samo skasowanie użytkownika
// wykonujemy klientem z SERVICE_ROLE (admin). Usunięcie użytkownika kaskadowo
// czyści jego dane (soma_entries, soma_chat_messages, soma_api_tokens itd. — FK ON DELETE CASCADE).
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Metoda niedozwolona" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Brak autoryzacji" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Ustal tożsamość na podstawie JWT.
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userErr } = await asUser.auth.getUser();
  if (userErr || !user) return json({ error: "Nieprawidłowa sesja" }, 401);

  const admin = createClient(url, service);

  // Zdjęcia w Storage (bucket `soma-photos`, folder `<user_id>/`) nie są objęte kaskadą FK —
  // usuń je jawnie. Błędy sprzątania nie mogą blokować usunięcia konta.
  try {
    const { data: files } = await admin.storage.from("soma-photos").list(user.id, { limit: 1000 });
    if (files && files.length) {
      await admin.storage.from("soma-photos").remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch { /* brak zdjęć / bucketu — pomijamy */ }

  // Skasuj użytkownika uprawnieniami admina — kaskada FK czyści dane w public.* (soma_entries,
  // soma_chat_messages, soma_user_settings, soma_api_tokens, soma_ai_usage itd.).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
});
