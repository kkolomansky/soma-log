export function calcScore(entry) {
  const doms = 11 - entry.doms;
  return Math.round(((entry.mood + entry.recovery + entry.sleep + doms) / 40) * 100);
}

export function scoreLabel(score) {
  if (score >= 75) return { text: 'Dobra regeneracja',       color: '#22c55e' };
  if (score >= 50) return { text: 'Umiarkowana regeneracja', color: '#eab308' };
  return               { text: 'Słaba regeneracja',          color: '#ef4444' };
}

export function scorePillClasses(score) {
  if (score >= 75) return 'ring-green-500 bg-green-500/10';
  if (score >= 50) return 'ring-yellow-500 bg-yellow-500/10';
  return 'ring-red-500 bg-red-500/10';
}
