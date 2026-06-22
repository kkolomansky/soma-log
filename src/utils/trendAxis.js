import { MONTHS_PL, toDateString } from './dateUtils';

const DAY = 86_400_000;

// 'YYYY-MM-DD' → ms (południe lokalnie, odporne na strefę czasową — spójne z dateUtils).
export function dateStrToMs(dateStr) {
  return new Date(dateStr + 'T12:00:00').getTime();
}

const labelDM = (ms) => { const d = new Date(ms); return `${d.getDate()} ${MONTHS_PL[d.getMonth()]}`; };
const labelMY = (ms) => { const d = new Date(ms); return `${MONTHS_PL[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`; };
const tick = (ms, label) => ({ ms, label });

// Dedup po dniu (zachowuje pierwszy) + sort rosnąco.
function dedupSort(ticks) {
  const seen = new Map();
  for (const t of ticks) {
    const key = toDateString(new Date(t.ms));
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()].sort((a, b) => a.ms - b.ms);
}

// Pierwsze dni miesięcy w przedziale (start, end].
function firstOfMonthsBetween(startMs, endMs) {
  const res = [];
  const d = new Date(startMs);
  let cur = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12); // pierwszy 1. po starcie
  while (cur.getTime() <= endMs) {
    res.push(cur.getTime());
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1, 12);
  }
  return res;
}

// Przerzedza do max N ticków, zachowując pierwszy i ostatni.
function thin(ticks, max) {
  if (ticks.length <= max) return ticks;
  const step = (ticks.length - 1) / (max - 1);
  const picked = [];
  for (let i = 0; i < max; i++) picked.push(ticks[Math.round(i * step)]);
  return dedupSort(picked);
}

/**
 * Oś czasowa wykresu trendów: { startMs, endMs, ticks: [{ ms, label }] }.
 * rangeDays: 7 | 30 | null (Wszystko). Dla „Wszystko" skala adaptacyjna wg rozpiętości danych.
 */
export function buildTimeAxis(rangeDays, entries) {
  const todayMs = dateStrToMs(toDateString(new Date()));

  // 7 dni — tick na każdy z 7 dni.
  if (rangeDays === 7) {
    const startMs = todayMs - 6 * DAY;
    const ticks = Array.from({ length: 7 }, (_, i) => tick(startMs + i * DAY, labelDM(startMs + i * DAY)));
    return { startMs, endMs: todayMs, ticks };
  }

  // 30 dni — dziś, miesiąc wstecz, granica miesiąca + kilka równych.
  if (rangeDays === 30) {
    const startMs = todayMs - 30 * DAY;
    const raw = [tick(startMs, labelDM(startMs)), tick(todayMs, labelDM(todayMs))];
    for (const ms of firstOfMonthsBetween(startMs, todayMs)) raw.push(tick(ms, labelDM(ms)));
    for (const f of [1 / 3, 2 / 3]) {
      const ms = startMs + Math.round((todayMs - startMs) * f);
      raw.push(tick(ms, labelDM(ms)));
    }
    return { startMs, endMs: todayMs, ticks: thin(dedupSort(raw), 6) };
  }

  // Wszystko — oś znaczona wyłącznie kolejnymi miesiącami (etykieta na środku pasma
  // danego miesiąca, bez dni → czytelnie i bez tłoku, niezależnie od rozpiętości).
  const msList = entries.map(e => dateStrToMs(e.entryDate));
  const minMs = msList.length ? Math.min(...msList) : todayMs - 6 * DAY;
  const maxMs = Math.max(...msList, todayMs);
  const ticks = [];
  const start = new Date(minMs);
  let cur = new Date(start.getFullYear(), start.getMonth(), 1, 12); // 1. miesiąca startu
  while (cur.getTime() <= maxMs) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1, 12);
    const mid = (Math.max(cur.getTime(), minMs) + Math.min(next.getTime(), maxMs)) / 2;
    // Rok dopisany przy styczniu albo pierwszym ticku — reszta sam miesiąc.
    const label = cur.getMonth() === 0 || ticks.length === 0 ? labelMY(cur.getTime()) : MONTHS_PL[cur.getMonth()];
    ticks.push(tick(mid, label));
    cur = next;
  }

  return { startMs: minMs, endMs: maxMs, ticks };
}
