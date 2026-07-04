import { supabase } from './supabase';
import { getVoice } from './voice';

// Wrappery na Edge Functions agenta. supabase.functions.invoke dokleja JWT i apikey.

// Rozmowa z agentem dla danego dnia — odpowiedź STRUMIENIOWA (słowo po słowie).
// onToken(partial) dostaje narastający tekst odpowiedzi; zwraca pełny tekst na końcu.
// Bezpośredni fetch (nie invoke), bo invoke buforuje strumień.
export async function chatWithAgent({ entryDate, history }, onToken) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entryDate, history, mode: 'chat' }),
  });
  if (!res.ok) {
    let msg = 'Błąd Logana';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (!res.body) {
    const text = await res.text();
    onToken?.(text);
    return text;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onToken?.(full);
  }
  return full;
}

// Analiza Logana (na żądanie): pełna, rozbudowana treść + krótki wyciąg (skrót).
export async function summarizeDay({ entryDate }) {
  const { data, error } = await supabase.functions.invoke('agent', {
    body: { entryDate, mode: 'summary' },
  });
  if (error) throw new Error(await readFnError(error));
  if (data?.error) throw new Error(data.error);
  const full = data?.reply ?? '';
  // Pusta treść z modelu = nie zapisuj „pustej" analizy jako sukces — pokaż błąd, pozwól ponowić.
  if (!full.trim()) throw new Error('Logan nie zwrócił analizy. Spróbuj ponownie.');
  return { full, short: data?.short ?? '' };
}

// Synteza mowy (xAI TTS) — zwraca Blob audio do odtworzenia. Głos: przekazany `voiceId`
// lub wybrany przez użytkownika (spójny). Bezpośredni fetch, bo invoke parsuje audio/mpeg jako tekst.
export async function speak(text, voiceId) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice_id: voiceId || getVoice() }),
  });
  if (!res.ok) {
    let msg = 'Błąd syntezy mowy';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return await res.blob(); // audio/mpeg
}

// Transkrypcja nagrania głosowego przez xAI STT.
export async function transcribeAudio(blob, language = 'pl') {
  const form = new FormData();
  form.append('language', language);
  form.append('file', blob, 'audio.webm');
  const { data, error } = await supabase.functions.invoke('transcribe', { body: form });
  if (error) throw new Error(await readFnError(error));
  if (data?.error) throw new Error(data.error);
  return data?.text ?? '';
}

// FunctionsHttpError trzyma treść w error.context (Response) — wyciągamy komunikat.
async function readFnError(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* ignore */ }
  return error.message || 'Błąd funkcji';
}
