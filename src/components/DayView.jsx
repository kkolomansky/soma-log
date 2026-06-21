import { useState, useEffect } from 'react';
import CircularGauge from './CircularGauge';
import { calcScore, scoreLabel } from '../utils/recoveryScore';
import { formatFullDate, toDateString } from '../utils/dateUtils';

const METRICS = [
  { key: 'mood',     label: 'Mood',     icon: '😊', color: '#22c55e' },
  { key: 'recovery', label: 'Recovery', icon: '⚡', color: '#eab308' },
  { key: 'sleep',    label: 'Sleep',    icon: '🌙', color: '#818cf8' },
  { key: 'doms',     label: 'DOMS',     icon: '🔥', color: '#f97316' },
];

function CloseIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PencilIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function MicIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// Krótki, jednolinijkowy opis dnia na podstawie snu i DOMS (najbardziej aktualne sygnały).
function dayDescription(entry) {
  const hi = (v) => (v >= 67 ? 'dobry' : v >= 34 ? 'umiarkowany' : 'słaby');
  const domsQ = entry.doms <= 33 ? 'niski' : entry.doms <= 66 ? 'umiarkowany' : 'wysoki';
  return `Sen ${hi(entry.sleep)}, DOMS ${domsQ}`;
}

function formatTime(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

// Edytowalna notatka dnia. Pusta → mikrofon na środku; wypełniona → mikrofon po prawej.
// Mikrofon to placeholder transkrypcji (logika później), nie blokuje pisania (pointer-events-none).
function NoteCard({ note, onSave }) {
  const [draft, setDraft] = useState(note ?? '');
  useEffect(() => { setDraft(note ?? ''); }, [note]);

  const hasText = draft.trim().length > 0;
  const handleBlur = () => {
    if (draft.trim() !== (note ?? '').trim()) onSave(draft.trim());
  };

  return (
    <div className="bg-[#1c1c1e] rounded-2xl p-4">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">Notatka</p>
      <div className="relative">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={hasText ? 3 : 2}
          className={`w-full bg-transparent text-gray-300 placeholder-gray-700 text-sm resize-none outline-none leading-relaxed ${hasText ? 'pr-9' : ''}`}
        />
        <div
          title="Transkrypcja głosowa — wkrótce"
          className={`pointer-events-none absolute text-gray-600 ${
            hasText ? 'right-0 top-0' : 'inset-0 flex items-center justify-center'
          }`}
        >
          <MicIcon />
        </div>
      </div>
    </div>
  );
}

export default function DayView({ entry, selectedDate, onAddClick, onDelete, onSaveNote }) {
  const today = toDateString(new Date());
  const isToday = selectedDate === today;
  const dateLabel = formatFullDate(selectedDate);

  // ── Dzień bez wpisu ──
  if (!entry) {
    return (
      <div className="px-3 py-5 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center gap-5 py-10">
          <div className="text-center">
            <p className="text-white font-semibold text-base capitalize">{dateLabel}</p>
            <p className="text-gray-600 text-xs mt-1">
              {isToday ? 'Brak wpisu na dziś' : 'Brak wpisu na ten dzień'}
            </p>
          </div>

          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#2a2a2a] bg-transparent text-gray-200 text-sm font-semibold hover:bg-[#1c1c1e] active:scale-95 transition-all"
          >
            <span className="text-lg leading-none">＋</span> Dodaj check-in
          </button>

          <p className="text-gray-600 text-sm text-center leading-relaxed">
            Uzupełnij dzienny check-in regeneracji
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard dnia ──
  const score = calcScore(entry);
  const label = scoreLabel(score);
  const createdTime = formatTime(entry.createdAt);
  const updatedTime = formatTime(entry.updatedAt);
  const wasUpdated = entry.updatedAt && entry.createdAt
    && new Date(entry.updatedAt) - new Date(entry.createdAt) > 60000;

  const iconBtn = 'shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-gray-600 transition-colors';

  return (
    <div className="px-3 py-5 flex flex-col gap-4 max-w-3xl mx-auto w-full">
      {/* Główna karta dnia */}
      <div className="bg-[#1c1c1e] rounded-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-white font-semibold text-base capitalize">{dateLabel}</p>
            {/* Znaczniki czasu — subtelne, pod datą */}
            {(createdTime || updatedTime) && (
              <p className="text-gray-600 text-[11px] mt-0.5">
                {createdTime && <span>Utworzono {createdTime}</span>}
                {wasUpdated && updatedTime && <span> · zaktualizowano {updatedTime}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onAddClick}
              aria-label="Edytuj check-in"
              className={`${iconBtn} hover:text-white hover:bg-[#252527]`}
            >
              <PencilIcon />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                aria-label="Usuń wpis"
                className={`${iconBtn} hover:text-red-500 hover:bg-[#252527]`}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CircularGauge value={score} max={100} color={label.color} size={88} strokeWidth={8} />
          <div className="min-w-0">
            <p className="text-base font-bold" style={{ color: label.color }}>{label.text}</p>
            <p className="text-gray-500 text-xs mt-1">{dayDescription(entry)}</p>
          </div>
        </div>
      </div>

      {/* Karta Recovery Check-in */}
      <div className="bg-[#1c1c1e] rounded-2xl p-4">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
          Recovery Check-in
        </p>
        <div className="grid grid-cols-4 gap-2">
          {METRICS.map(m => (
            <div key={m.key} className="flex flex-col items-center gap-1.5">
              <CircularGauge value={entry[m.key]} max={100} color={m.color} size={56} strokeWidth={5} />
              <span className="text-base">{m.icon}</span>
              <span className="text-gray-500 text-[10px] font-medium">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notatka — edytowalna, z mikrofonem (placeholder transkrypcji) */}
      <NoteCard key={entry.id} note={entry.note} onSave={onSaveNote} />
    </div>
  );
}
