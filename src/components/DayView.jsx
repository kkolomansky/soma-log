import CircularGauge from './CircularGauge';
import { calcScore, scoreLabel } from '../utils/recoveryScore';
import { formatFullDate, toDateString } from '../utils/dateUtils';

const METRICS = [
  { key: 'mood',     label: 'Mood',     icon: '😊', color: '#22c55e' },
  { key: 'recovery', label: 'Recovery', icon: '⚡', color: '#eab308' },
  { key: 'sleep',    label: 'Sleep',    icon: '🌙', color: '#818cf8' },
  { key: 'doms',     label: 'DOMS',     icon: '🔥', color: '#f97316' },
];

function MicIcon({ size = 28, color = '#6b7280' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export default function DayView({ entry, selectedDate, onAddClick, onDelete }) {
  const today = toDateString(new Date());
  const isToday = selectedDate === today;
  const dateLabel = formatFullDate(selectedDate);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 gap-6">
        <div className="text-center">
          <p className="text-white font-semibold text-base capitalize">{dateLabel}</p>
          <p className="text-gray-600 text-xs mt-1">
            {isToday ? 'Brak wpisu na dziś' : 'Brak wpisu na ten dzień'}
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="w-20 h-20 rounded-full bg-[#1c1c1e] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#252525] active:scale-95 transition-all"
        >
          <MicIcon />
        </button>

        <p className="text-gray-600 text-sm text-center leading-relaxed">
          Nagraj swoje przemyślenia<br />lub dodaj wpis ręcznie
        </p>
      </div>
    );
  }

  const score = calcScore(entry);
  const label = scoreLabel(score);

  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      {/* Date + score + delete */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold text-base capitalize">{dateLabel}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold" style={{ color: label.color }}>{score}%</span>
            <span className="text-xs" style={{ color: label.color }}>{label.text}</span>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-gray-700 hover:text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-[#1c1c1e] transition-colors"
          >
            usuń
          </button>
        )}
      </div>

      {/* 4 circular gauges */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map(m => (
          <div key={m.key} className="flex flex-col items-center gap-2">
            <CircularGauge value={entry[m.key]} color={m.color} size={72} strokeWidth={7} />
            <span className="text-lg">{m.icon}</span>
            <span className="text-gray-500 text-[10px] font-medium">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Note */}
      {entry.note && (
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <p className="text-gray-500 text-xs font-medium mb-2">📝 NOTATKA</p>
          <p className="text-gray-300 text-sm leading-relaxed">{entry.note}</p>
        </div>
      )}
    </div>
  );
}
