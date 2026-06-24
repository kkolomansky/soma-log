// Głosy xAI TTS dostępne dla Logana (param voice_id). Wybór zapisywany w localStorage,
// żeby odczyt Analizy/Podsumowania zawsze używał tego samego, wybranego głosu.
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

// Krótka próbka do odsłuchu w pickerze.
export const SAMPLE_TEXT = 'Cześć, jestem Logan, Twój trener regeneracji. Tak brzmi mój głos.';
