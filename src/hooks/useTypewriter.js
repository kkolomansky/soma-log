import { useState, useEffect, useRef } from 'react';

/**
 * Stopniowe odsłanianie tekstu (efekt „pisania"/strumienia) po stronie klienta.
 * Animacja rusza dopiero, gdy zmieni się `playKey` (np. po świeżej analizie Logana).
 * Zmiana samego `text` bez nowego `playKey` (np. przełączenie dnia) pokazuje treść od razu.
 *
 * @param {string} text pełny tekst do wyświetlenia
 * @param {number} playKey licznik — inkrementuj, by odtworzyć animację
 * @param {number} charsPerTick ile znaków dosłać na klatkę
 * @param {number} tickMs odstęp między klatkami (ms)
 * @returns {string} aktualnie odsłonięty fragment tekstu
 */
export function useTypewriter(text, playKey, charsPerTick = 3, tickMs = 16) {
  const [shown, setShown] = useState(text || '');
  const lastKey = useRef(playKey);

  useEffect(() => {
    // Bez nowego playKey → brak animacji (montaż, zmiana dnia): pełny tekst.
    if (playKey === lastKey.current) {
      setShown(text || '');
      return;
    }
    lastKey.current = playKey;
    if (!text) { setShown(''); return; }

    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i += charsPerTick;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, tickMs);
    return () => clearInterval(id);
  }, [text, playKey, charsPerTick, tickMs]);

  return shown;
}
