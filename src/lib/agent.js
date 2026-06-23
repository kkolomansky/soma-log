import { supabase } from './supabase';

// Wrappery na Edge Functions agenta. supabase.functions.invoke dokleja JWT i apikey.

// Rozmowa z agentem dla danego dnia. history = [{ role, content }] (bez systemu).
export async function chatWithAgent({ entryDate, history }) {
  const { data, error } = await supabase.functions.invoke('agent', {
    body: { entryDate, history, mode: 'chat' },
  });
  if (error) throw new Error(await readFnError(error));
  if (data?.error) throw new Error(data.error);
  return data?.reply ?? '';
}

// Analiza Logana (na żądanie): pełna, rozbudowana treść + krótki wyciąg (skrót).
export async function summarizeDay({ entryDate }) {
  const { data, error } = await supabase.functions.invoke('agent', {
    body: { entryDate, mode: 'summary' },
  });
  if (error) throw new Error(await readFnError(error));
  if (data?.error) throw new Error(data.error);
  return { full: data?.reply ?? '', short: data?.short ?? '' };
}

// Synteza mowy (xAI TTS, głos leo) — zwraca Blob audio do odtworzenia.
export async function speak(text) {
  const { data, error } = await supabase.functions.invoke('tts', { body: { text } });
  if (error) throw new Error(await readFnError(error));
  if (data instanceof Blob) {
    if (data.type.includes('application/json')) {
      const parsed = JSON.parse(await data.text());
      throw new Error(parsed.error || 'Błąd syntezy mowy');
    }
    return data;
  }
  if (data?.error) throw new Error(data.error);
  throw new Error('Nie otrzymano audio');
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
