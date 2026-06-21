const MONTHS_PL = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

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

export function formatPill(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.getDate(),
    month: MONTHS_PL[d.getMonth()],
  };
}

export function formatFullDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
