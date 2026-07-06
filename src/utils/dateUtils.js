export const MONTHS_PL = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

// Skróty dni tygodnia wg getDay(): 0 = niedziela … 6 = sobota.
const WEEKDAYS_PL = ['nd','pn','wt','śr','czw','pt','sb'];

export function toDateString(date) {
  // Returns 'YYYY-MM-DD' in LOCAL time (avoids UTC mismatch)
  return date.toLocaleDateString('en-CA');
}

export function buildLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateString(d));
  }
  return days; // oldest first → today last
}

// Lista dni 'YYYY-MM-DD' od startStr do endStr włącznie (oldest first).
// Bezpiecznik na wypadek odwróconych/nieprawidłowych dat i bardzo długich zakresów.
export function buildDayRange(startStr, endStr) {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
  const days = [];
  const d = new Date(start);
  let guard = 0;
  while (d <= end && guard < 3660) { // ~10 lat max
    days.push(toDateString(d));
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return days;
}

export function formatPill(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.getDate(),
    month: MONTHS_PL[d.getMonth()],
    weekday: WEEKDAYS_PL[d.getDay()],
  };
}

export function formatFullDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export function formatMonthYear(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
}
