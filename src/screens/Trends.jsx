import { useState } from 'react';
import TrendChart from '../components/TrendChart';

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
      <div className="px-4 pt-6 flex flex-col items-center">
        <div className="text-center mt-16">
          <p className="text-5xl mb-4">📈</p>
          <p className="text-gray-500 text-sm">Brak wpisów do wyświetlenia.</p>
          <p className="text-gray-600 text-xs mt-1">Dodaj wpisy, by śledzić trendy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-gray-600 text-sm">{filtered.length} wpisów</span>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl p-4">
        <p className="text-gray-400 text-xs font-semibold mb-3">📊 TRENDY W CZASIE</p>

        {/* Przełącznik zakresu */}
        <div className="flex gap-2 mb-4">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: rangeIdx === i ? '#ffffff' : '#2a2a2a',
                color:           rangeIdx === i ? '#000000' : '#6b7280',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {filtered.length < 2 ? (
          <p className="text-gray-600 text-xs text-center py-8">
            Potrzeba co najmniej 2 wpisów w wybranym zakresie,{'\n'}by pokazać wykres.
          </p>
        ) : (
          <TrendChart entries={filtered} />
        )}
      </div>
    </div>
  );
}
