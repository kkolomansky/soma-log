import { MONTHS_PL, toDateString } from './dateUtils';

const DAY = 86_400_000;

// 'YYYY-MM-DD' → ms (południe lokalnie, odporne na strefę czasową — spójne z dateUtils).
export function dateStrToMs(dateStr) {
  return new Date(dateStr + 'T12:00:00').getTime();
}

const labelDM = (ms) => { const d = new Date(ms); return `${d.getDate()} ${MONTHS_PL[d.getMonth()]}`; };
const labelMY = (ms) => { const d = new Date(ms); return `${MONTHS_PL[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`; };
const tick = (ms, label) => ({ ms, label });

// Pierwszy dzień miesiąca (południe) dla danego ms.
function firstOfMonth(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1, 12).getTime();
}
// Przesunięcie o n miesięcy (zachowuje południe, bezpieczne dla granic miesięcy).
function addMonths(ms, n) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 12).getTime();
}
function clampMs(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const WINDOW_MONTHS = 12; // „Wszystko": widoczne okno = ostatni rok, przewijane w głąb historii.

/**
 * Granice przewijania widoku „Wszystko": { spanStart, spanEnd, minEnd, maxEnd, canPan }.
 * Okno ma stałą długość WINDOW_MONTHS; windowEnd porusza się w [minEnd, maxEnd].
 */
export function allRangeBounds(entries) {
  const todayMs = dateStrToMs(toDateString(new Date()));
  const msList = entries.map(e => dateStrToMs(e.entryDate));
  const earliest = msList.length ? Math.min(...msList) : todayMs;
  const spanStart = firstOfMonth(earliest);
  const spanEnd = todayMs;
  const minEnd = addMonths(spanStart, WINDOW_MONTHS);
  const maxEnd = spanEnd;
  return { spanStart, spanEnd, minEnd: Math.min(minEnd, maxEnd), maxEnd, canPan: minEnd < maxEnd };
}

/**
 * Oś czasowa wykresu trendów: { startMs, endMs, ticks: [{ ms, label }] }.
 * rangeDays: 7 | 30 | null (Wszystko). Dla „Wszystko" skala adaptacyjna wg rozpiętości danych.
 */
export function buildTimeAxis(rangeDays, entries, windowEndMs) {
  const todayMs = dateStrToMs(toDateString(new Date()));

  // 7 dni — tick na każdy z 7 dni.
  if (rangeDays === 7) {
    const startMs = todayMs - 6 * DAY;
    const ticks = Array.from({ length: 7 }, (_, i) => tick(startMs + i * DAY, labelDM(startMs + i * DAY)));
    return { startMs, endMs: todayMs, ticks };
  }

  // 30 dni — 7 równo rozłożonych dat co 5 dni (0,5,…,30 wstecz).
  if (rangeDays === 30) {
    const startMs = todayMs - 30 * DAY;
    const ticks = Array.from({ length: 7 }, (_, i) => {
      const ms = startMs + i * 5 * DAY;
      return tick(ms, labelDM(ms));
    });
    return { startMs, endMs: todayMs, ticks };
  }

  // Wszystko — okno 12 miesięcy kończące się w windowEnd (domyślnie dziś), przewijane.
  // Każdy miesiąc = jeden tick (etykieta na środku pasma miesiąca); rok dopisany przy
  // styczniu oraz pierwszym widocznym miesiącu.
  const { spanStart, spanEnd, minEnd, maxEnd } = allRangeBounds(entries);
  const end = clampMs(windowEndMs ?? spanEnd, minEnd, maxEnd);
  let winStart = addMonths(end, -WINDOW_MONTHS);
  if (winStart < spanStart) winStart = spanStart; // mniej danych niż rok → nie schodź poniżej

  const ticks = [];
  let cur = firstOfMonth(winStart);
  while (cur <= end) {
    const next = addMonths(cur, 1);
    const mid = (Math.max(cur, winStart) + Math.min(next, end)) / 2;
    const d = new Date(cur);
    const label = d.getMonth() === 0 || ticks.length === 0 ? labelMY(cur) : MONTHS_PL[d.getMonth()];
    ticks.push(tick(mid, label));
    cur = next;
  }

  return { startMs: winStart, endMs: end, ticks };
}
