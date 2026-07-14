// Synteza mowy SomaLog — czyta analizę Logana „głosem Jarvisa" (xAI TTS, głos leo).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/logan.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
const XAI_TTS_URL = "https://api.x.ai/v1/tts";

Deno.serve(async (req) => {
  const CORS = corsHeaders(req);
  const jsonErr = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonErr("Method not allowed", 405);
  if (!XAI_API_KEY) return jsonErr("Brak konfiguracji XAI_API_KEY", 500);

  // Weryfikacja zalogowanego użytkownika — jak w `transcribe`. Bramka `verify_jwt = true` przepuszcza
  // publiczny klucz anon, więc endpoint proxujący do płatnego xAI musi sam potwierdzić realną sesję.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return jsonErr("Brak autoryzacji", 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return jsonErr("Nieprawidłowa sesja", 401);

  let body: { text?: string; voice_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonErr("Nieprawidłowy JSON", 400);
  }

  const text = (body.text ?? "").trim();
  if (!text) return jsonErr("Brak tekstu do odczytania", 400);

  const res = await fetch(XAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.slice(0, 15000),
      voice_id: body.voice_id || "leo",
      language: "pl",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return jsonErr(`Błąd xAI TTS: ${res.status} ${detail}`, 502);
  }

  // Przepuść audio dalej (mp3) do klienta.
  const audio = await res.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: { ...CORS, "Content-Type": "audio/mpeg" },
  });
});
