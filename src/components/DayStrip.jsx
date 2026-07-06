import { useRef, useEffect, useState, useCallback } from 'react';
import { formatPill, formatMonthYear, toDateString } from '../utils/dateUtils';
import { calcScore, scoreColor } from '../utils/recoveryScore';

const ITEM_W = 72; // px (w-[72px])

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

function ChevronDown({ size = 13 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Pozioma karuzela dni z efektem 3D: wyśrodkowany dzień jest pełny i podświetlony,
 * sąsiednie skalowane/wyszarzone i lekko obrócone (jak rzut karuzeli od frontu).
 * Wyśrodkowany dzień = wybrany dzień. Działa na mobile i desktopie.
 */
export default function DayStrip({ days, selectedDate, entriesByDate, onSelect, hasCustomRange, onOpenRange, onResetRange }) {
  const scrollerRef = useRef(null);
  const itemRefs = useRef(new Map());
  const rafRef = useRef(0);
  const settleRef = useRef(null);
  const holdRef = useRef({ timeout: null, raf: null });
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const today = toDateString(new Date());
  const [centerDate, setCenterDate] = useState(selectedDate);

  // Środki liczone z getBoundingClientRect — odporne na transform (skala/rotacja są
  // symetryczne względem środka) i niezależne od offsetParent.
  const nearestDate = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return null;
    const rect = scroller.getBoundingClientRect();
    const viewCenter = rect.left + rect.width / 2;
    let best = null, bestDist = Infinity;
    for (const [date, el] of itemRefs.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - viewCenter);
      if (dist < bestDist) { bestDist = dist; best = date; }
    }
    return best;
  }, []);

  // Efekt 3D: scale + opacity + rotateY zależne od odległości od środka.
  const applyEffect = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const viewCenter = rect.left + rect.width / 2;
    const half = rect.width / 2;
    let best = null, bestDist = Infinity;
    for (const [date, el] of itemRefs.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const elCenter = r.left + r.width / 2;
      const dist = Math.abs(elCenter - viewCenter);
      const norm = Math.min(dist / half, 1);
      const scale = 1 - 0.32 * norm;
      const rotateY = (elCenter < viewCenter ? 1 : -1) * 26 * norm;
      el.style.transform = `perspective(600px) rotateY(${rotateY}deg) scale(${scale})`;
      el.style.opacity = String(1 - 0.62 * norm);
      el.style.zIndex = String(1000 - Math.round(dist));
      if (dist < bestDist) { bestDist = dist; best = date; }
    }
    if (best) setCenterDate(prev => (prev === best ? prev : best));
  }, []);

  const onScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(applyEffect);
    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const best = nearestDate();
      if (best && best !== selectedDate) onSelect(best);
    }, 140);
  }, [applyEffect, nearestDate, onSelect, selectedDate]);

  const centerOn = useCallback((date, behavior = 'smooth') => {
    const el = itemRefs.current.get(date);
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior });
  }, []);

  // Start: wyśrodkuj wybrany dzień + nałóż efekt.
  useEffect(() => {
    centerOn(selectedDate, 'auto');
    requestAnimationFrame(applyEffect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zewnętrzna zmiana wybranego dnia (np. po zapisie) → wyśrodkuj.
  useEffect(() => {
    if (selectedDate !== centerDate) centerOn(selectedDate, 'smooth');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Strzałki: klik → 1 pozycja; przytrzymanie → płynne przewijanie, które PRZYSPIESZA
  // z czasem trzymania (dla dłuższych okresów szybciej dojedziemy do celu).
  const stopHold = useCallback(() => {
    if (holdRef.current.timeout) { clearTimeout(holdRef.current.timeout); holdRef.current.timeout = null; }
    if (holdRef.current.raf) { cancelAnimationFrame(holdRef.current.raf); holdRef.current.raf = null; }
  }, []);

  const startHold = useCallback((dir) => {
    stopHold();
    scrollerRef.current?.scrollBy({ left: dir * ITEM_W, behavior: 'smooth' }); // klik = 1 krok
    const startTime = performance.now();
    holdRef.current.timeout = setTimeout(() => {
      let last = performance.now();
      const loop = (now) => {
        const held = now - startTime;
        const dt = Math.min(now - last, 50); last = now;
        // px/ms: start ~0.5 (≈ dotychczasowe tempo), rośnie do 3.0 przy dłuższym trzymaniu.
        const speed = Math.min(0.5 + held / 700, 3);
        const sc = scrollerRef.current;
        if (sc) sc.scrollLeft += dir * speed * dt;
        holdRef.current.raf = requestAnimationFrame(loop);
      };
      holdRef.current.raf = requestAnimationFrame(loop);
    }, 300);
  }, [stopHold]);

  // Przeciąganie karuzeli myszą (jak wykres trendów). Dotyk/pen → natywne przewijanie.
  // Przechwycenie wskaźnika dopiero po realnym ruchu, by nie psuć zwykłych kliknięć w dzień.
  const onDragStart = useCallback((e) => {
    if (e.pointerType !== 'mouse') return;
    const sc = scrollerRef.current; if (!sc) return;
    dragRef.current = { startX: e.clientX, startScroll: sc.scrollLeft, capturing: false };
    draggedRef.current = false;
  }, []);
  const onDragMove = useCallback((e) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.startX;
    if (!d.capturing && Math.abs(dx) > 4) {
      d.capturing = true;
      draggedRef.current = true;
      const sc = scrollerRef.current;
      if (sc) { sc.style.scrollSnapType = 'none'; sc.setPointerCapture?.(e.pointerId); }
    }
    if (d.capturing) {
      const sc = scrollerRef.current;
      if (sc) sc.scrollLeft = d.startScroll - dx;
    }
  }, []);
  const onDragEnd = useCallback((e) => {
    const d = dragRef.current; if (!d) return;
    dragRef.current = null;
    const sc = scrollerRef.current;
    if (sc && d.capturing) {
      sc.style.scrollSnapType = 'x mandatory';
      sc.releasePointerCapture?.(e.pointerId);
      const best = nearestDate();
      if (best) centerOn(best, 'smooth'); // domknij do najbliższego dnia
    }
  }, [nearestDate, centerOn]);

  // Sprzątanie timerów przy odmontowaniu.
  useEffect(() => stopHold, [stopHold]);

  const arrowBtn = 'shrink-0 w-9 h-9 rounded-full bg-surface border border-border text-txt-2 hover:text-txt hover:bg-elevated flex items-center justify-center transition-colors';
  const sidePad = `calc(50% - ${ITEM_W / 2}px)`;

  return (
    <div className="select-none border-b border-divider">
      <div className="flex items-center justify-center gap-2 pt-3 pb-1">
        {/* Nazwa miesiąca/rok = przycisk otwierający kalendarz wyboru okresu. */}
        <button
          onClick={onOpenRange}
          className="flex items-center gap-1 text-txt-3 hover:text-txt transition-colors"
          aria-label="Wybierz okres"
        >
          <span className="text-xs font-display font-semibold uppercase tracking-wide capitalize">
            {formatMonthYear(centerDate)}
          </span>
          <ChevronDown />
        </button>

        {/* Oznaczenie: karuzela pokazuje wybrany okres, nie domyślny ostatni miesiąc. */}
        {hasCustomRange && (
          <span className="flex items-center gap-1 rounded-full bg-recovery/15 text-recovery text-[10px] font-medium pl-2 pr-1 py-0.5">
            Wybrany okres
            <button
              onClick={onResetRange}
              aria-label="Wróć do ostatniego miesiąca"
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-recovery/25 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 px-2 pb-3">
        <button
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className={arrowBtn} aria-label="Wcześniej"><Chevron dir="left" /></button>

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 isolate cursor-grab active:cursor-grabbing"
          style={{ scrollSnapType: 'x mandatory', paddingLeft: sidePad, paddingRight: sidePad }}
        >
          {days.map(dateStr => {
            const { day, weekday } = formatPill(dateStr);
            const entry = entriesByDate.get(dateStr);
            const isCenter = dateStr === centerDate;
            const isToday = dateStr === today;
            const sc = entry ? calcScore(entry) : null;
            const col = sc != null ? scoreColor(sc) : null;
            return (
              <button
                key={dateStr}
                ref={el => { if (el) itemRefs.current.set(dateStr, el); else itemRefs.current.delete(dateStr); }}
                onClick={() => { if (draggedRef.current) { draggedRef.current = false; return; } centerOn(dateStr); }}
                style={{ scrollSnapAlign: 'center', transformOrigin: 'center', borderColor: col ?? undefined }}
                className={`relative shrink-0 w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center will-change-transform transition-[background-color,border-color]
                  ${entry ? 'border-2' : 'border border-border'}
                  ${isToday ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-bg' : ''}
                  ${isCenter ? 'bg-white/10' : 'bg-surface'}`}
              >
                <span className="text-[9px] font-medium leading-none text-txt-3 mb-0.5">{weekday}</span>
                <span className={`text-lg font-display font-bold leading-none ${isCenter ? 'text-txt' : 'text-txt-2'}`}>{day}</span>
                {sc != null ? (
                  <span className="text-[11px] font-mono font-semibold leading-none mt-1" style={{ color: col }}>{sc}%</span>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-border-strong mt-1.5" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className={arrowBtn} aria-label="Później"><Chevron dir="right" /></button>
      </div>
    </div>
  );
}
