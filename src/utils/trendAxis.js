import { MONTHS_PL, toDateString } from './dateUtils';

const DAY = 86_400_000;

// 'YYYY-MM-DD' → ms (południe lokalnie, odporne na strefę czasową — spójne z dateUtils).
export function dateStrToMs(dateStr) {
  return new Date(dateStr + 'T12:00:00').getTime();
}

const labelDM = (ms) => { const d = new Date(ms); return `${d.getDate()} ${MONTHS_PL[d.getMonth()]}`; };
const labelMY = (ms) => { const d = new Date(ms); return `${MONTHS_PL[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`; };
const tick = (ms, label) => ({ ms, label });

function clampMs(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// „Wszystko": widoczne okno = ostatni rok. STAŁA szerokość (w ms) → przewijanie
// jest czystą translacją, wykres się nie rozciąga.
const WINDOW_MS = 365 * DAY;
// Miesiące kończące kwartały: mar(2), cze(5), wrz(8), gru(11).
const QUARTER_END = new Set([2, 5, 8, 11]);

/**
 * Granice przewijania widoku „Wszystko": { spanStart, spanEnd, minEnd, maxEnd, canPan }.
 * Okno ma stałą szerokość WINDOW_MS; windowEnd porusza się w [minEnd, maxEnd].
 */
export function allRangeBounds(entries) {
  const todayMs = dateStrToMs(toDateString(new Date()));
  const msList = entries.map(e => dateStrToMs(e.entryDate));
  const spanStart = msList.length ? Math.min(...msList) : todayMs;
  const maxEnd = todayMs;
  const minEnd = Math.min(spanStart + WINDOW_MS, maxEnd);
  return { spanStart, spanEnd: maxEnd, minEnd, maxEnd, canPan: spanStart + WINDOW_MS < maxEnd };
}

// Znaczniki osi dla „Wszystko": miesiące kończące kwartały (mar/cze/wrz/gru) z rokiem,
// np. „Wrz '25". Fallback na kolejne miesiące, gdy okno jest za krótkie na 2 końce kwartałów.
function quarterTicks(startMs, endMs) {
  const inWin = (ms) => ms >= startMs && ms <= endMs;
  const first = new Date(new Date(startMs).getFullYear(), new Date(startMs).getMonth(), 1, 12);
  const midOf = (d) => new Date(d.getFullYear(), d.getMonth(), 15, 12).getTime(); // środek miesiąca

  const quarters = [];
  const months = [];
  for (let c = new Date(first); c.getTime() <= endMs; c = new Date(c.getFullYear(), c.getMonth() + 1, 1, 12)) {
    const ms = midOf(c);
    if (!inWin(ms)) continue;
    months.push(tick(ms, labelMY(ms)));
    if (QUARTER_END.has(c.getMonth())) quarters.push(tick(ms, labelMY(ms)));
  }
  if (quarters.length >= 2) return quarters;
  return months.length ? months : quarters;
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

  // Wszystko — okno stałej szerokości (ostatni rok), przewijane; oś = końce kwartałów.
  const { spanStart, minEnd, maxEnd, canPan } = allRangeBounds(entries);
  let winStart, end;
  if (canPan) {
    end = clampMs(windowEndMs ?? maxEnd, minEnd, maxEnd);
    winStart = end - WINDOW_MS;
  } else {
    // Mniej danych niż rok → zmieść całość, bez przewijania.
    end = maxEnd;
    winStart = spanStart;
  }

  return { startMs: winStart, endMs: end, ticks: quarterTicks(winStart, end) };
}
