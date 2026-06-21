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

/**
 * Pozioma karuzela dni z efektem 3D: wyśrodkowany dzień jest pełny i podświetlony,
 * sąsiednie skalowane/wyszarzone i lekko obrócone (jak rzut karuzeli od frontu).
 * Wyśrodkowany dzień = wybrany dzień. Działa na mobile i desktopie.
 */
export default function DayStrip({ days, selectedDate, entriesByDate, onSelect }) {
  const scrollerRef = useRef(null);
  const itemRefs = useRef(new Map());
  const rafRef = useRef(0);
  const settleRef = useRef(null);
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

  const arrowBtn = 'shrink-0 w-9 h-9 rounded-full bg-[#1c1c1e] border border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#252525] flex items-center justify-center transition-colors';
  const sidePad = `calc(50% - ${ITEM_W / 2}px)`;

  return (
    <div className="select-none border-b border-[#1e1e1e]">
      <p className="text-center text-gray-500 text-xs font-semibold uppercase tracking-wide pt-3 pb-1 capitalize">
        {formatMonthYear(centerDate)}
      </p>

      <div className="flex items-center gap-1 px-2 pb-3">
        <button onClick={() => scrollerRef.current?.scrollBy({ left: -ITEM_W, behavior: 'smooth' })}
          className={arrowBtn} aria-label="Wcześniej"><Chevron dir="left" /></button>

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 isolate"
          style={{ scrollSnapType: 'x mandatory', paddingLeft: sidePad, paddingRight: sidePad }}
        >
          {days.map(dateStr => {
            const { day } = formatPill(dateStr);
            const entry = entriesByDate.get(dateStr);
            const isCenter = dateStr === centerDate;
            const isToday = dateStr === today;
            const sc = entry ? calcScore(entry) : null;
            const col = sc != null ? scoreColor(sc) : null;
            return (
              <button
                key={dateStr}
                ref={el => { if (el) itemRefs.current.set(dateStr, el); else itemRefs.current.delete(dateStr); }}
                onClick={() => centerOn(dateStr)}
                style={{ scrollSnapAlign: 'center', transformOrigin: 'center', borderColor: col ?? undefined }}
                className={`relative shrink-0 w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center will-change-transform transition-[background-color,border-color]
                  ${entry ? 'border-2' : 'border border-[#2a2a2a]'}
                  ${isToday ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#111111]' : ''}
                  ${isCenter ? 'bg-white/10' : 'bg-[#1c1c1e]'}`}
              >
                <span className={`text-lg font-bold leading-none ${isCenter ? 'text-white' : 'text-gray-300'}`}>{day}</span>
                {sc != null ? (
                  <span className="text-[11px] font-semibold leading-none mt-1" style={{ color: col }}>{sc}%</span>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-[#3a3a3a] mt-1.5" />
                )}
              </button>
            );
          })}
        </div>

        <button onClick={() => scrollerRef.current?.scrollBy({ left: ITEM_W, behavior: 'smooth' })}
          className={arrowBtn} aria-label="Później"><Chevron dir="right" /></button>
      </div>
    </div>
  );
}
