import CircularGauge from '../components/CircularGauge';

const METRICS = [
  { key: 'mood',     label: 'Mood',     icon: '😊', color: '#22c55e' },
  { key: 'recovery', label: 'Recovery', icon: '⚡', color: '#eab308' },
  { key: 'sleep',    label: 'Sleep',    icon: '🌙', color: '#818cf8' },
  { key: 'doms',     label: 'DOMS',     icon: '🔥', color: '#f97316' },
];

/**
 * Współczynnik regeneracji 0–100%
 * Mood + Recovery + Sleep są w skali 1–10 (wyżej = lepiej).
 * DOMS jest odwrócony: 11 − wartość, bo 10/10 DOMS = najgorszy ból.
 * Suma maksymalna = 40, dzielimy przez 40 i przeliczamy na procent.
 */
function overallScore(entry) {
  const doms = 11 - entry.doms;
  return Math.round(((entry.mood + entry.recovery + entry.sleep + doms) / 40) * 100);
}

function scoreLabel(score) {
  if (score >= 75) return { text: 'Dobra regeneracja',       color: '#22c55e' };
  if (score >= 50) return { text: 'Umiarkowana regeneracja', color: '#eab308' };
  return               { text: 'Słaba regeneracja',          color: '#ef4444' };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('pl-PL', {
    hour: '2-digit', minute: '2-digit',
  });
}

export default function LogList({ entries, onDelete }) {
  if (entries.length === 0) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center">
        <h2 className="text-xl font-bold text-white tracking-tight w-full mb-16">Dziennik</h2>
        <div className="text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500 text-sm">Brak wpisów.</p>
          <p className="text-gray-600 text-xs mt-1">Dodaj swój pierwszy wpis!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Dziennik</h2>
        <span className="text-gray-600 text-sm">{entries.length} wpisów</span>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map(entry => {
          const score = overallScore(entry);
          const label = scoreLabel(score);
          return (
            <div key={entry.id} className="bg-[#1c1c1e] rounded-2xl p-4">

              {/* Header: data + score + usuń */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-white text-sm font-semibold capitalize">
                    {formatDate(entry.timestamp)}
                  </p>
                  <p className="text-gray-600 text-xs">{formatTime(entry.timestamp)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: label.color }}>{score}%</p>
                    <p className="text-[10px]" style={{ color: label.color }}>{label.text}</p>
                  </div>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-gray-700 hover:text-red-500 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-[#2a2a2a]"
                  >
                    usuń
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#2a2a2a] my-3" />

              {/* Kołowe wskaźniki */}
              <div className="grid grid-cols-4 gap-2">
                {METRICS.map(m => (
                  <div key={m.key} className="flex flex-col items-center gap-2">
                    <CircularGauge value={entry[m.key]} color={m.color} size={64} strokeWidth={6} />
                    <span className="text-base">{m.icon}</span>
                    <span className="text-gray-500 text-[10px] font-medium">{m.label}</span>
                  </div>
                ))}
              </div>

              {entry.note ? (
                <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-[#2a2a2a] leading-relaxed line-clamp-2">
                  {entry.note}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
