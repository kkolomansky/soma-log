// Skala wielkości interfejsu (czcionki). Zwiększa czytelność, szczególnie na mobile,
// gdzie część tekstu jest bardzo drobna. Realizowana przez `zoom` na <html>, dzięki
// czemu skaluje CAŁY tekst — również ten w px (Tailwind text-[11px] itd.). Trwałe w localStorage.

const KEY = 'somalog.fontScale';

export const FONT_SCALES = [
  { id: 'sm', label: 'Standardowa', value: 1 },
  { id: 'md', label: 'Większa',     value: 1.12 },
  { id: 'lg', label: 'Największa',   value: 1.25 },
];

export function getFontScale() {
  try {
    const id = localStorage.getItem(KEY);
    return FONT_SCALES.some(s => s.id === id) ? id : 'sm';
  } catch { return 'sm'; }
}

export function applyFontScale(id) {
  const scale = FONT_SCALES.find(s => s.id === id) ?? FONT_SCALES[0];
  if (typeof document !== 'undefined') {
    // `zoom` skaluje layout + tekst proporcjonalnie; wartość 1 czyścimy (brak efektu).
    document.documentElement.style.zoom = scale.value === 1 ? '' : String(scale.value);
  }
}

export function setFontScale(id) {
  try { localStorage.setItem(KEY, id); } catch { /* prywatny tryb */ }
  applyFontScale(id);
}

// Wywołaj raz przy starcie aplikacji, by zastosować zapisaną skalę.
export function initFontScale() {
  applyFontScale(getFontScale());
}
