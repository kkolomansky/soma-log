import { useState } from 'react';
import { toDateString, MONTHS_PL } from '../utils/dateUtils';

const WEEK = ['pn', 'wt', 'śr', 'czw', 'pt', 'sb', 'nd'];
const MONTHS_FULL = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];

// Indeks (0 = pn) pierwszego dnia miesiąca (konwersja z getDay() gdzie 0 = nd).
function leadingBlanks(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function fmtShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

/**
 * Modal wyboru okresu (data startu + data końca) dla karuzeli.
 * Pierwszy klik = start, drugi = koniec (wcześniejsza data zawsze staje się startem).
 * „Zastosuj" przekazuje (startStr, endStr); dostępne też szybkie zakresy.
 */
export default function DateRangePicker({ open, onClose, onApply, initialStart, initialEnd }) {
  const today = new Date();
  const [view, setView] = useState(() => {
    const base = initialEnd ? new Date(initialEnd + 'T12:00:00') : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [start, setStart] = useState(initialStart ?? null);
  const [end, setEnd] = useState(initialEnd ?? null);

  if (!open) return null;

  const pick = (dateStr) => {
    if (!start || (start && end)) { setStart(dateStr); setEnd(null); return; }
    if (dateStr < start) { setEnd(start); setStart(dateStr); }
    else setEnd(dateStr);
  };

  const inRange = (ds) => start && end && ds >= start && ds <= end;
  const isEdge = (ds) => ds === start || ds === end;

  const prevMonth = () => setView(v => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }));
  const nextMonth = () => setView(v => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }));

  const lead = leadingBlanks(view.year, view.month);
  const total = daysInMonth(view.year, view.month);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  const apply = () => { if (start && end) onApply(start, end); };
  const applyLastDays = (n) => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - (n - 1));
    onApply(toDateString(s), toDateString(e));
  };
  const applyThisYear = () => onApply(`${today.getFullYear()}-01-01`, toDateString(today));

  const navBtn = 'w-8 h-8 rounded-full flex items-center justify-center text-txt-2 hover:text-txt hover:bg-elevated transition-colors';
  const presetBtn = 'px-2.5 py-1 rounded-lg bg-elevated text-txt-2 text-[11px] hover:text-txt transition-colors';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-border-strong rounded-2xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-txt font-display font-semibold text-sm">Wybierz okres</p>
          <button onClick={onClose} aria-label="Zamknij"
            className="w-7 h-7 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-elevated transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nawigacja miesiąca */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className={navBtn} aria-label="Poprzedni miesiąc"><Chevron dir="left" /></button>
          <p className="text-txt-2 text-sm font-medium capitalize">{MONTHS_FULL[view.month]} {view.year}</p>
          <button onClick={nextMonth} className={navBtn} aria-label="Następny miesiąc"><Chevron dir="right" /></button>
        </div>

        {/* Dni tygodnia */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEK.map(w => <span key={w} className="text-center text-txt-3 text-[10px] py-1">{w}</span>)}
        </div>

        {/* Siatka dni */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <span key={i} />;
            const ds = toDateString(new Date(view.year, view.month, d));
            const edge = isEdge(ds);
            const mid = !edge && inRange(ds);
            return (
              <button
                key={i}
                onClick={() => pick(ds)}
                className={`h-8 rounded-lg text-xs transition-colors ${
                  edge ? 'bg-recovery text-bg font-semibold'
                    : mid ? 'bg-recovery/15 text-txt'
                    : 'text-txt-2 hover:bg-elevated'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Podsumowanie wyboru */}
        <p className="mt-3 text-txt-3 text-[11px] text-center">
          {start ? `${fmtShort(start)}  →  ${end ? fmtShort(end) : '…'}` : 'Kliknij datę startu, potem datę końca'}
        </p>

        {/* Szybkie zakresy */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          <button onClick={() => applyLastDays(90)} className={presetBtn}>Ostatnie 3 mies.</button>
          <button onClick={() => applyLastDays(180)} className={presetBtn}>Ostatnie 6 mies.</button>
          <button onClick={applyThisYear} className={presetBtn}>Ten rok</button>
        </div>

        {/* Akcje */}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-elevated text-txt-2 text-sm font-medium hover:text-txt transition-colors">
            Anuluj
          </button>
          <button
            onClick={apply}
            disabled={!start || !end}
            className="flex-1 py-2 rounded-xl bg-recovery text-bg text-sm font-semibold disabled:opacity-40 active:scale-95 transition-all"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </div>
  );
}
