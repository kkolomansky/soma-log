// Transkrypcja głosowa SomaLog — przekazuje nagranie do xAI Grok STT (/v1/stt).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonWith } from "../_shared/logan.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
const XAI_STT_URL = "https://api.x.ai/v1/stt";

Deno.serve(async (req) => {
  const CORS = corsHeaders(req);
  const json = jsonWith(CORS);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!XAI_API_KEY) return json({ error: "Brak konfiguracji XAI_API_KEY" }, 500);

  // Weryfikacja zalogowanego użytkownika. `verify_jwt = true` w config.toml odrzuca żądania bez
  // JWT, ale akceptuje publiczny klucz anon (jest w bundlu klienta) — więc endpoint proxujący do
  // płatnego xAI musi sam potwierdzić realną sesję, inaczej obcy mógłby generować koszt. Wzorzec
  // jak w `tokens`/`delete-account`.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Brak autoryzacji" }, 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "Nieprawidłowa sesja" }, 401);

  let inForm: FormData;
  try {
    inForm = await req.formData();
  } catch {
    return json({ error: "Oczekiwano multipart/form-data z polem 'file'" }, 400);
  }

  const file = inForm.get("file");
  if (!(file instanceof File)) return json({ error: "Brak pliku audio" }, 400);
  const language = (inForm.get("language") as string) || "pl";

  // Kolejność pól ma znaczenie dla xAI: plik na końcu.
  const out = new FormData();
  out.append("model", "grok-stt");
  out.append("language", language);
  out.append("format", "json");
  out.append("file", file, file.name || "audio.webm");

  const res = await fetch(XAI_STT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${XAI_API_KEY}` },
    body: out,
  });

  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Błąd xAI STT: ${res.status} ${text}` }, 502);
  }

  const data = await res.json();
  const text = data.text ?? data.transcript ?? "";
  return json({ text });
});
