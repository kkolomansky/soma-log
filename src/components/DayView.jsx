import { useState, useEffect, useRef } from 'react';
import CircularGauge from './CircularGauge';
import Trends from '../screens/Trends';
import { calcScore, scoreLabel } from '../utils/recoveryScore';
import { METRICS } from '../utils/metrics';
import { GaugeIcon, TrendsIcon } from './icons';

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

// Edytowalna notatka dnia. Pusta → mikrofon na środku; wypełniona → mikrofon po prawej.
function NoteCard({ note, onSave }) {
  const [draft, setDraft] = useState(note ?? '');
  useEffect(() => { setDraft(note ?? ''); }, [note]);

  const hasText = draft.trim().length > 0;
  const handleBlur = () => {
    if (draft.trim() !== (note ?? '').trim()) onSave(draft.trim());
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-txt-3 text-xs font-medium uppercase tracking-wide mb-2">Notatka</p>
      <div className="relative">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={hasText ? 3 : 2}
          className={`w-full bg-transparent text-txt-2 placeholder-txt-3 text-sm resize-none outline-none leading-relaxed ${hasText ? 'pr-9' : ''}`}
        />
        <div
          title="Transkrypcja głosowa — wkrótce"
          className={`pointer-events-none absolute text-txt-3 ${
            hasText ? 'right-0 top-0' : 'inset-0 flex items-center justify-center'
          }`}
        >
          <MicIcon />
        </div>
      </div>
    </div>
  );
}

// Modal potwierdzenia usunięcia — ten sam ciemny design co reszta aplikacji.
function ConfirmDeleteModal({ open, onCancel, onConfirm }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
      />
      <div className={`fixed inset-0 z-[70] flex items-center justify-center px-6 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`w-full max-w-xs bg-elevated border border-border rounded-2xl p-5 transition-[transform,opacity] duration-200 ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <p className="text-txt font-display font-semibold text-base text-center">Usunąć wpis?</p>
          <p className="text-txt-3 text-sm text-center mt-1.5">Czy na pewno chcesz usunąć ten wpis? Tej operacji nie można cofnąć.</p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-txt-2 hover:bg-surface transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white hover:opacity-90 transition-opacity"
            >
              Usuń
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Zakładki Wskaźniki / Trendy — obramówka aktywnej zakładki zlana z kartą poniżej (efekt „teczki").
function SectionTabs({ tab, onChange, children }) {
  const TABS = [
    { id: 'wskazniki', label: 'Wskaźniki', desc: 'Dzisiejsze parametry', Icon: GaugeIcon },
    { id: 'trendy',    label: 'Trendy',    desc: 'Historia w czasie',    Icon: TrendsIcon },
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="grid grid-cols-2">
        {TABS.map(({ id, label, desc, Icon }, i) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-3 p-3 text-left transition-colors
                ${i === 0 ? 'rounded-tl-2xl border-r' : 'rounded-tr-2xl'} border-border
                ${active ? 'bg-surface' : 'bg-bg/40 border-b'}`}
            >
              <span className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${active ? 'text-recovery bg-recovery/10' : 'text-txt-3 bg-elevated'}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-display font-semibold leading-tight ${active ? 'text-txt' : 'text-txt-2'}`}>{label}</span>
                <span className="block text-txt-3 text-[11px] leading-tight">{desc}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DayView({ entry, days, selectedDate, entries, onSelect, onAddClick, onDelete, onSaveNote }) {
  const [tab, setTab] = useState('wskazniki');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Przesuwanie palcem w lewo/prawo → zmiana dnia (karuzela podąża za selectedDate).
  const swipeRef = useRef({ x: 0, y: 0, active: false });
  const SWIPE_THRESHOLD = 50;

  const goRelative = (delta) => {
    if (!days || !onSelect) return;
    const idx = days.indexOf(selectedDate);
    if (idx === -1) return;
    const next = idx + delta;
    if (next >= 0 && next < days.length) onSelect(days[next]);
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchEnd = (e) => {
    if (!swipeRef.current.active) return;
    swipeRef.current.active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.x;
    const dy = t.clientY - swipeRef.current.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return; // ignoruj pionowy ruch
    goRelative(dx < 0 ? 1 : -1); // w lewo → następny dzień, w prawo → poprzedni
  };

  const swipeHandlers = { onTouchStart, onTouchEnd };

  // ── Dzień bez wpisu ──
  if (!entry) {
    return (
      <div className="px-3 py-5 flex flex-col gap-6 max-w-3xl mx-auto w-full" {...swipeHandlers}>
        <div className="flex flex-col items-center justify-center gap-5 py-10">
          <button
            onClick={() => onAddClick()}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-recovery text-bg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="text-lg leading-none">＋</span> Dodaj check-in
          </button>
          <p className="text-txt-3 text-sm text-center leading-relaxed">
            Uzupełnij dzienny check-in regeneracji
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard dnia ──
  const score = calcScore(entry);
  const label = scoreLabel(score);
  const iconBtn = 'shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-txt-3 transition-colors';

  return (
    <div className="px-3 py-5 flex flex-col gap-4 max-w-3xl mx-auto w-full" {...swipeHandlers}>
      <SectionTabs tab={tab} onChange={setTab}>
        {tab === 'wskazniki' ? (
          <>
            <div className="flex items-center justify-end gap-1 mb-1">
              <button
                onClick={() => onAddClick()}
                aria-label="Edytuj check-in"
                className={`${iconBtn} hover:text-txt hover:bg-elevated`}
              >
                <PencilIcon />
              </button>
              {onDelete && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Usuń wpis"
                  className={`${iconBtn} hover:text-danger hover:bg-elevated`}
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            {/* Duży zegar ogólnej regeneracji — na górze, wyśrodkowany */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <CircularGauge value={score} max={100} color={label.color} size={170} strokeWidth={12} />
              <p className="text-base font-display font-bold text-center leading-tight" style={{ color: label.color }}>
                {label.text}
              </p>
            </div>

            {/* Parametry — stała siatka 3×2, równomiernie rozłożone (klik → edycja) */}
            <div className="grid grid-cols-3 gap-3">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => onAddClick(m.key)}
                  aria-label={`Edytuj: ${m.label}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-elevated transition-colors"
                >
                  <CircularGauge value={entry[m.key]} max={100} color={m.color} size={64} strokeWidth={6} />
                  <span className="flex items-center gap-1 min-w-0">
                    <span style={{ color: m.color }}><m.Icon size={14} /></span>
                    <span className="text-txt-2 text-xs font-medium leading-tight truncate">{m.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <Trends entries={entries} />
        )}
      </SectionTabs>

      {tab === 'wskazniki' && <NoteCard key={entry.id} note={entry.note} onSave={onSaveNote} />}

      <ConfirmDeleteModal
        open={confirmingDelete}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => { setConfirmingDelete(false); onDelete(entry.id); }}
      />
    </div>
  );
}
