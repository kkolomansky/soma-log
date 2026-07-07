import { useState, useRef, useEffect } from 'react';
import TrendChart from '../components/TrendChart';
import TrendLandscapeModal from '../components/TrendLandscapeModal';
import { TrendsIcon } from '../components/icons';
import { buildTimeAxis, allRangeBounds, dateStrToMs } from '../utils/trendAxis';
import { MONTHS_PL } from '../utils/dateUtils';

const RANGES = [
  { label: '7 dni',    days: 7 },
  { label: '30 dni',   days: 30 },
  { label: 'Wszystko', days: null },
];

const clampMs = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const monthYear = (ms) => { const d = new Date(ms); return `${MONTHS_PL[d.getMonth()].toLowerCase()} ${d.getFullYear()}`; };

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

export default function Trends({ entries }) {
  const [rangeIdx, setRangeIdx] = useState(2);
  // Koniec widocznego 12-mies. okna dla „Wszystko" (null = najnowsze, czyli dziś).
  const [windowEnd, setWindowEnd] = useState(null);
  const [landscape, setLandscape] = useState(false); // powiększony podgląd (mobile: poziomo / web: pionowo)
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const modalDragRef = useRef(null); // panning wewnątrz powiększonego modala
  const tapRef = useRef(null); // wykrycie „tap" (bez przeciągnięcia) → otwarcie powiększenia

  // Widok mobilny → kliknięcie wykresu otwiera go w poziomie (czytelniejsze osie/dane).
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = e => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const days = RANGES[rangeIdx].days;
  const isAll = days === null;

  // Zmiana zakresu → wróć do najnowszego okna.
  useEffect(() => { setWindowEnd(null); }, [rangeIdx]);

  const bounds = allRangeBounds(entries);
  const effEnd = clampMs(windowEnd ?? bounds.maxEnd, bounds.minEnd, bounds.maxEnd);
  const canPan = isAll && bounds.canPan;

  const axis = buildTimeAxis(days, entries, effEnd);
  // Punkty w obrębie domeny osi (po realnej dacie dnia, nie created_at).
  const filtered = entries.filter(e => {
    const ms = dateStrToMs(e.entryDate);
    return ms >= axis.startMs - 43_200_000 && ms <= axis.endMs + 43_200_000;
  });

  const shiftMonths = (n) => setWindowEnd(() => {
    const d = new Date(effEnd);
    const next = new Date(d.getFullYear(), d.getMonth() + n, d.getDate(), 12).getTime();
    return clampMs(next, bounds.minEnd, bounds.maxEnd);
  });

  // Gest na obszarze wykresu jest „przechwytywany" (stopPropagation), więc NIE przełącza
  // dnia — zmiana dnia możliwa tylko poza wykresem (patrz DayView). Przy „Wszystko" gest
  // panoramuje wykres; krótki tap (bez ruchu) na mobile otwiera widok poziomy.
  const onPointerDown = (e) => {
    e.stopPropagation();
    tapRef.current = { x: e.clientX, y: e.clientY, moved: false };
    if (!canPan) return;
    const plotW = (wrapRef.current?.clientWidth ?? 320) * (324 / 360); // szer. pola wykresu
    dragRef.current = { startX: e.clientX, startEnd: effEnd, span: axis.endMs - axis.startMs, plotW };
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* brak aktywnego wskaźnika */ }
  };
  const onPointerMove = (e) => {
    const tap = tapRef.current;
    if (tap && (Math.abs(e.clientX - tap.x) > 8 || Math.abs(e.clientY - tap.y) > 8)) tap.moved = true;
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const deltaMs = -(dx / d.plotW) * d.span;
    setWindowEnd(clampMs(d.startEnd + deltaMs, bounds.minEnd, bounds.maxEnd));
  };
  const endDrag = (e) => {
    const tap = tapRef.current;
    tapRef.current = null;
    if (dragRef.current) { dragRef.current = null; try { e.currentTarget?.releasePointerCapture?.(e.pointerId); } catch { /* nie przechwycono */ } }
    // Tap (bez przeciągnięcia) → powiększony widok wykresu (mobile: poziomo, web: pionowo).
    if (tap && !tap.moved) setLandscape(true);
  };
  // Zablokuj też natywny gest dotykowy przed dotarciem do przełącznika dni (DayView).
  const stopTouch = (e) => e.stopPropagation();

  // Uchwyty panningu dla powiększonego modala (współdzielą stan `windowEnd`, więc po
  // zamknięciu widok pozostaje zsynchronizowany). `rotated` → w obróconym 90° oknie
  // lokalna oś czasu = ekranowe Y, więc panujemy po clientY.
  const makePan = (rotated) => ({
    onPointerDown: (e) => {
      if (!canPan) return;
      const plotW = (e.currentTarget.clientWidth || 320) * (324 / 360);
      modalDragRef.current = { start: rotated ? e.clientY : e.clientX, startEnd: effEnd, span: axis.endMs - axis.startMs, plotW };
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* brak wskaźnika */ }
    },
    onPointerMove: (e) => {
      const d = modalDragRef.current; if (!d) return;
      const delta = (rotated ? e.clientY : e.clientX) - d.start;
      setWindowEnd(clampMs(d.startEnd - (delta / d.plotW) * d.span, bounds.minEnd, bounds.maxEnd));
    },
    onPointerUp: (e) => { if (modalDragRef.current) { modalDragRef.current = null; try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* noop */ } } },
    onPointerCancel: () => { modalDragRef.current = null; },
  });

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
      <div className="flex items-center gap-2 mb-3 flex-nowrap">
        <span className="text-recovery shrink-0"><TrendsIcon size={16} /></span>
        <p className="text-txt-2 text-xs font-display font-semibold uppercase tracking-wide whitespace-nowrap truncate">Trendy w czasie</p>
        {isAll ? (
          <span className="ml-auto flex items-baseline gap-1.5 font-mono text-xs whitespace-nowrap shrink-0">
            <span className="text-txt-2">{filtered.length}</span>
            <span className="text-txt-3">w okresie</span>
            <span className="text-txt-3">·</span>
            <span className="text-txt-2">{entries.length}</span>
            <span className="text-txt-3">łącznie</span>
          </span>
        ) : (
          <span className="text-txt-3 text-xs font-mono ml-auto whitespace-nowrap shrink-0">{filtered.length} wpisów</span>
        )}
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

      {/* Sterowanie oknem „Wszystko": strzałki + zakres + podpowiedź o przeciąganiu */}
      {canPan && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => shiftMonths(-1)}
            disabled={effEnd <= bounds.minEnd}
            aria-label="Wcześniej"
            className="w-8 h-8 rounded-full bg-elevated text-txt-2 hover:text-txt flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <Chevron dir="left" />
          </button>
          <p className="flex-1 text-center text-txt-3 text-[11px] font-mono capitalize">
            {monthYear(axis.startMs)} – {monthYear(axis.endMs)}
          </p>
          <button
            onClick={() => shiftMonths(1)}
            disabled={effEnd >= bounds.maxEnd}
            aria-label="Później"
            className="w-8 h-8 rounded-full bg-elevated text-txt-2 hover:text-txt flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <Chevron dir="right" />
          </button>
        </div>
      )}

      {filtered.length < 2 ? (
        <p className="text-txt-3 text-xs text-center py-8">
          Potrzeba co najmniej 2 wpisów w wybranym zakresie,{'\n'}by pokazać wykres.
        </p>
      ) : (
        <div
          ref={wrapRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onTouchStart={stopTouch}
          className={`touch-pan-y select-none ${canPan ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        >
          <TrendChart entries={filtered} startMs={axis.startMs} endMs={axis.endMs} ticks={axis.ticks} />
        </div>
      )}

      <TrendLandscapeModal
        open={landscape}
        onClose={() => setLandscape(false)}
        rotate={isMobile}
        canPan={canPan}
        panHandlers={makePan(isMobile)}
        entries={filtered}
        startMs={axis.startMs}
        endMs={axis.endMs}
        ticks={axis.ticks}
      />
    </div>
  );
}
