// Transkrypcja głosowa SomaLog — przekazuje nagranie do xAI Grok STT (/v1/stt).
const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
const XAI_STT_URL = "https://api.x.ai/v1/stt";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!XAI_API_KEY) return json({ error: "Brak konfiguracji XAI_API_KEY" }, 500);

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
