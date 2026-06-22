// Wszystkie parametry w skali 0–100. Zmęczenie/bolesność/stres odwrócone (niżej = lepiej → 100 - v).
export function calcScore(entry) {
  const positive = entry.sleep + entry.energy + entry.motivation;
  const negative = (100 - entry.fatigue) + (100 - entry.doms) + (100 - entry.stress);
  return Math.round((positive + negative) / 6);
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
