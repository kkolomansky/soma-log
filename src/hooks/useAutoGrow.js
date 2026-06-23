import { useLayoutEffect } from 'react';

// Auto-wzrost <textarea>: rośnie do `maxRows` wierszy, powyżej — wewnętrzny scroll.
// Pusta wartość → 1 wiersz (placeholder nie podbija wysokości).
export function useAutoGrow(ref, value, maxRows = 4) {
  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const cs = getComputedStyle(ta);
    const line = parseFloat(cs.lineHeight) || 20;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const oneRow = line + pad;
    const max = line * maxRows + pad;
    if (!value) {
      ta.style.height = `${oneRow}px`;
      ta.style.overflowY = 'hidden';
      return;
    }
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`;
    ta.style.overflowY = ta.scrollHeight > max ? 'auto' : 'hidden';
  }, [ref, value, maxRows]);
}
