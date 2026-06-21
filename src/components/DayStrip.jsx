import { useRef, useEffect } from 'react';
import { formatPill, toDateString } from '../utils/dateUtils';
import { calcScore, scorePillClasses } from '../utils/recoveryScore';

export default function DayStrip({ days, selectedDate, entriesByDate, onSelect, vertical = false }) {
  const containerRef = useRef(null);
  const today = toDateString(new Date());

  // On vertical mode, today is first (reversed order from parent), so it's always visible.
  // On horizontal mode, auto-scroll to today pill.
  useEffect(() => {
    if (vertical) return;
    const el = containerRef.current?.querySelector('[data-today="true"]');
    if (el) el.scrollIntoView({ inline: 'end', block: 'nearest', behavior: 'instant' });
  }, [vertical]);

  // Desktop sidebar shows newest first (today at top)
  const displayDays = vertical ? [...days].reverse() : days;

  return (
    <div
      ref={containerRef}
      className={`scrollbar-hide ${
        vertical
          ? 'flex flex-col gap-1 overflow-y-auto py-2 px-3'
          : 'flex flex-row gap-2 overflow-x-auto px-4 py-3 shrink-0'
      }`}
    >
      {displayDays.map(dateStr => {
        const { day, month } = formatPill(dateStr);
        const entry = entriesByDate.get(dateStr);
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === today;
        const ringBase = entry ? scorePillClasses(calcScore(entry)) : 'ring-[#2a2a2a] bg-[#1c1c1e]';
        const selectedExtra = isSelected ? 'ring-white ring-2 bg-white/10' : '';

        if (vertical) {
          return (
            <button
              key={dateStr}
              data-today={isToday ? 'true' : undefined}
              onClick={() => onSelect(dateStr)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ring-1 ${ringBase} ${selectedExtra}`}
            >
              <div className="text-left min-w-0">
                <p className={`text-sm font-bold leading-none ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {day} {month}
                </p>
                {isToday && <p className="text-[10px] text-gray-600 mt-0.5">dziś</p>}
              </div>
              {entry && (
                <span
                  className="ml-auto text-xs font-semibold shrink-0"
                  style={{ color: calcScore(entry) >= 75 ? '#22c55e' : calcScore(entry) >= 50 ? '#eab308' : '#ef4444' }}
                >
                  {calcScore(entry)}%
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={dateStr}
            data-today={isToday ? 'true' : undefined}
            onClick={() => onSelect(dateStr)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-all ring-1 ${ringBase} ${selectedExtra}`}
          >
            <span className={`text-sm font-bold leading-none ${isSelected ? 'text-white' : 'text-gray-300'}`}>
              {day}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">{month}</span>
            {isToday && <span className="w-1 h-1 rounded-full bg-white mt-1" />}
          </button>
        );
      })}
    </div>
  );
}
