// Wszystkie parametry w skali 0–100. DOMS odwrócony (niżej = lepiej → 100 - doms).
export function calcScore(entry) {
  return Math.round((entry.mood + entry.recovery + entry.sleep + (100 - entry.doms)) / 4);
}

// 5 poziomów regeneracji co 20 (czerwony → zielony).
export function scoreLabel(score) {
  if (score >= 80) return { text: 'Bardzo dobra regeneracja', color: '#22c55e' };
  if (score >= 60) return { text: 'Dobra regeneracja',        color: '#84cc16' };
  if (score >= 40) return { text: 'Średnia regeneracja',      color: '#eab308' };
  if (score >= 20) return { text: 'Słaba regeneracja',        color: '#f97316' };
  return               { text: 'Bardzo słaba regeneracja', color: '#ef4444' };
}

export function scoreColor(score) {
  return scoreLabel(score).color;
}
