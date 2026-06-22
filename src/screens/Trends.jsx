import { useState } from 'react';
import TrendChart from '../components/TrendChart';
import { TrendsIcon } from '../components/icons';

const RANGES = [
  { label: '7 dni',    days: 7 },
  { label: '30 dni',   days: 30 },
  { label: 'Wszystko', days: null },
];

export default function Trends({ entries }) {
  const [rangeIdx, setRangeIdx] = useState(2);

  const filtered = RANGES[rangeIdx].days
    ? entries.filter(e => {
        const cutoff = Date.now() - RANGES[rangeIdx].days * 86_400_000;
        return new Date(e.timestamp).getTime() >= cutoff;
      })
    : entries;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <span className="text-txt-3 mb-3"><TrendsIcon size={40} /></span>
        <p className="text-txt-2 text-sm">Brak wpisów do wyświetlenia.</p>
        <p className="text-txt-3 text-xs mt-1">Dodaj wpisy, by śledzić trendy.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-recovery"><TrendsIcon size={16} /></span>
        <p className="text-txt-2 text-xs font-display font-semibold uppercase tracking-wide">Trendy w czasie</p>
        <span className="text-txt-3 text-xs font-mono ml-auto">{filtered.length} wpisów</span>
      </div>

      {/* Przełącznik zakresu */}
      <div className="flex gap-2 mb-4">
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setRangeIdx(i)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              rangeIdx === i ? 'bg-recovery text-bg' : 'bg-elevated text-txt-3 hover:text-txt-2'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filtered.length < 2 ? (
        <p className="text-txt-3 text-xs text-center py-8">
          Potrzeba co najmniej 2 wpisów w wybranym zakresie,{'\n'}by pokazać wykres.
        </p>
      ) : (
        <TrendChart entries={filtered} />
      )}
    </div>
  );
}
