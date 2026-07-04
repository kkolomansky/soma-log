import { supabase } from './supabase';

// Głosy xAI TTS dostępne dla Logana (param voice_id). Wybór trwały per konto w Supabase
// (tabela soma_user_settings) z lokalnym cache, żeby odczyt Analizy/Podsumowania zawsze
// używał tego samego, wybranego głosu — także po wylogowaniu i w nowej sesji.
export const VOICES = [
  { id: 'leo', label: 'Leo', desc: 'dostojny, autorytatywny' },
  { id: 'rex', label: 'Rex', desc: 'pewny siebie' },
  { id: 'sal', label: 'Sal', desc: 'wyważony, neutralny' },
  { id: 'ara', label: 'Ara', desc: 'ciepły, miękki' },
  { id: 'eve', label: 'Eve', desc: 'energiczny' },
];

export const DEFAULT_VOICE = 'leo';
const KEY = 'logan.voice';

export function getVoice() {
  try {
    const v = localStorage.getItem(KEY);
    return VOICES.some(x => x.id === v) ? v : DEFAULT_VOICE;
  } catch {
    return DEFAULT_VOICE;
  }
}

export function setVoice(id) {
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
}

const SETTINGS_TABLE = 'soma_user_settings';

// Wczytuje głos zapisany na koncie i odświeża lokalny cache. Wołane po zalogowaniu,
// dzięki czemu wybór przenosi się między sesjami i urządzeniami. Bezpieczny fallback do cache.
export async function loadVoiceFromServer() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getVoice();
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('voice')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) return getVoice();
    const v = VOICES.some(x => x.id === data.voice) ? data.voice : DEFAULT_VOICE;
    try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
    return v;
  } catch {
    return getVoice();
  }
}

// Zapisuje wybór głosu na koncie (upsert po user_id). Cache lokalny ustawia setVoice().
export async function saveVoiceToServer(id) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from(SETTINGS_TABLE)
      .upsert(
        { user_id: user.id, voice: id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
  } catch { /* ignore */ }
}

// Krótka próbka do odsłuchu w pickerze.
export const SAMPLE_TEXT = 'Cześć, jestem Logan, Twój trener regeneracji. Tak brzmi mój głos.';
