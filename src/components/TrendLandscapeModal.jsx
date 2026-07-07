import { useEffect } from 'react';
import TrendChart from './TrendChart';
import { TrendsIcon } from './icons';

function CloseBtn({ onClose }) {
  return (
    <button
      onClick={onClose}
      aria-label="Zamknij powiększenie"
      className="w-9 h-9 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors shrink-0"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

function Header({ onClose }) {
  return (
    <div className="flex items-center justify-between mb-2 shrink-0">
      <span className="flex items-center gap-2 text-txt-2 text-sm font-display font-semibold uppercase tracking-wide">
        <span className="text-recovery"><TrendsIcon size={16} /></span> Trendy w czasie
      </span>
      <CloseBtn onClose={onClose} />
    </div>
  );
}

/**
 * Powiększony podgląd wykresu trendów.
 * - rotate=true (mobile): scena obrócona o 90° wypełniająca wąski ekran (poziomo po obróceniu telefonu).
 * - rotate=false (web): pełnoekranowa nakładka z pionowym, powiększonym wykresem.
 * Gdy canPan (okres „Wszystko") → przeciąganie po obszarze wykresu przewija okno czasu
 * (uchwyty z Trends współdzielą stan, więc po zamknięciu widok zostaje zsynchronizowany).
 */
export default function TrendLandscapeModal({ open, onClose, rotate, canPan, panHandlers, entries, startMs, endMs, ticks }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Odetnij gesty od reszty aplikacji (DayView): dopóki modal jest otwarty, przewijanie
  // wykresu ani szybkie przeciągnięcie NIE mogą zmienić dnia ani zamknąć okna. Zamknięcie
  // tylko przyciskiem ✕ (lub Esc).
  const stop = (e) => e.stopPropagation();
  const isolate = {
    onPointerDown: stop, onPointerMove: stop, onPointerUp: stop, onPointerCancel: stop,
    onTouchStart: stop, onTouchMove: stop, onTouchEnd: stop,
  };

  const chartWrapClass = `w-full select-none ${canPan ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`;
  const chart = (
    <div className={chartWrapClass} {...(canPan ? panHandlers : {})}>
      <TrendChart entries={entries} startMs={startMs} endMs={endMs} ticks={ticks} />
    </div>
  );

  // Mobile: scena obrócona 90° wypełniająca ekran.
  if (rotate) {
    return (
      <div className="fixed inset-0 z-[90] bg-bg" {...isolate}>
        <div
          className="absolute top-0 flex flex-col p-4"
          style={{ left: '100%', width: '100vh', height: '100vw', transformOrigin: '0 0', transform: 'rotate(90deg)' }}
        >
          <Header onClose={onClose} />
          <div className="flex-1 min-h-0 flex items-center">{chart}</div>
        </div>
      </div>
    );
  }

  // Web: pionowy, powiększony wykres wyśrodkowany na pełnoekranowej nakładce.
  // Klik w tło NIE zamyka (żeby przeciąganie nie zamykało okna) — tylko ✕ / Esc.
  return (
    <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-6" {...isolate}>
      <div className="w-full max-w-4xl bg-bg border border-border rounded-2xl p-5 shadow-2xl">
        <Header onClose={onClose} />
        {chart}
      </div>
    </div>
  );
}
