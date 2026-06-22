import { useState, useEffect, useRef } from 'react';
import { formatFullDate } from '../utils/dateUtils';
import { METRICS, METRIC_DEFAULTS } from '../utils/metrics';
import Slider from './Slider';

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

function pickMetrics(entry) {
  return Object.fromEntries(METRICS.map(m => [m.key, entry[m.key]]));
}

export default function AddEntryModal({ open, onClose, onSave, initialEntry = null, selectedDate, focusKey = null }) {
  const [values, setValues] = useState(METRIC_DEFAULTS);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlight, setHighlight] = useState(null);

  // Przeciągnięcie sheetu w dół (mobile) → zamknięcie.
  const panelRef = useRef(null);
  const dragRef = useRef({ startY: 0, dy: 0, dragging: false });
  const [dragY, setDragY] = useState(0);
  const CLOSE_THRESHOLD = 100;

  // Referencje wierszy parametrów — do przewinięcia po kliknięciu konkretnego parametru.
  const rowRefs = useRef({});

  useEffect(() => {
    if (open) {
      // Edycja istniejącego dnia → prefill jego wartościami; nowy wpis → wartości domyślne.
      setValues(initialEntry ? pickMetrics(initialEntry) : METRIC_DEFAULTS);
      setNote(initialEntry?.note ?? '');
      setSaving(false);
      setDragY(0);
    }
  }, [open, initialEntry]);

  // Po otwarciu z konkretnym parametrem: przewiń do niego i chwilowo podświetl.
  useEffect(() => {
    if (!open || !focusKey) { setHighlight(null); return; }
    const t = setTimeout(() => {
      rowRefs.current[focusKey]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setHighlight(focusKey);
    }, 120);
    const clear = setTimeout(() => setHighlight(null), 2000);
    return () => { clearTimeout(t); clearTimeout(clear); };
  }, [open, focusKey]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...values, note: note.trim() });
  };

  // Gest „pull-to-dismiss" — tylko ruch w dół.
  const onDragStart = (clientY) => {
    dragRef.current = { startY: clientY, dy: 0, dragging: true };
  };
  const onDragMove = (clientY) => {
    if (!dragRef.current.dragging) return;
    const dy = clientY - dragRef.current.startY;
    dragRef.current.dy = dy;
    setDragY(dy > 0 ? dy : 0);
  };
  const onDragEnd = () => {
    if (!dragRef.current.dragging) return;
    const dy = dragRef.current.dy;
    dragRef.current.dragging = false;
    if (dy > CLOSE_THRESHOLD) onClose();
    else setDragY(0);
  };

  const dateLabel = selectedDate ? formatFullDate(selectedDate) : (initialEntry ? 'Edytuj wpis' : 'Nowy wpis');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet wrapper — pełnoekranowy kontener do centrowania na desktopie */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center md:justify-center
          ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Panel */}
        <div
          ref={panelRef}
          className={`w-full bg-bg border border-border rounded-t-3xl ease-out
            md:w-[420px] md:rounded-3xl md:max-h-[90vh]
            ${dragY > 0 ? '' : 'transition-[transform,opacity] duration-300'}
            ${open ? 'opacity-100' : 'translate-y-full opacity-0 invisible'}`}
          style={open && dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          {/* Uchwyt (mobile) — strefa gestu przeciągnięcia w dół + data na górze + X */}
          <div
            className="relative flex items-center justify-center px-4 pt-5 pb-2 md:cursor-default touch-none"
            onTouchStart={e => onDragStart(e.touches[0].clientY)}
            onTouchMove={e => onDragMove(e.touches[0].clientY)}
            onTouchEnd={onDragEnd}
            onPointerDown={e => { if (e.pointerType !== 'touch') onDragStart(e.clientY); }}
            onPointerMove={e => { if (e.pointerType !== 'touch') onDragMove(e.clientY); }}
            onPointerUp={onDragEnd}
          >
            <div className="md:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 bg-border rounded-full" />
            <p className="text-txt font-display font-semibold text-base capitalize">{dateLabel}</p>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="absolute right-3 top-3 flex items-center justify-center w-8 h-8 rounded-full bg-elevated text-txt-2 hover:text-txt transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[80vh] px-4 pb-7 pt-2">
            {/* Lista parametrów: etykieta z lewej, suwak + wartość z prawej */}
            <div className="bg-surface border border-border rounded-2xl px-4 divide-y divide-border mb-3">
              {METRICS.map(m => (
                <div
                  key={m.key}
                  ref={el => { rowRefs.current[m.key] = el; }}
                  className={`flex items-center gap-3 py-3 -mx-4 px-4 rounded-xl transition-colors ${
                    highlight === m.key ? 'bg-elevated ring-1 ring-inset' : ''
                  }`}
                  style={highlight === m.key ? { '--tw-ring-color': m.color } : undefined}
                >
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <span style={{ color: m.color }}><m.Icon size={18} /></span>
                    <span className="text-txt text-sm font-medium">{m.label}</span>
                  </div>
                  <Slider
                    value={values[m.key]}
                    onChange={e => setValues(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                    className="flex-1 min-w-0"
                  />
                  <span className="w-9 text-right text-sm font-mono font-semibold tabular-nums" style={{ color: m.color }}>
                    {values[m.key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Notatka */}
            <div className="bg-surface border border-border rounded-2xl p-4 mb-3">
              <p className="text-txt-3 text-xs mb-2 font-medium uppercase tracking-wide">Notatka</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Co dzisiaj czujesz? Jak był trening?"
                className="w-full bg-transparent text-txt placeholder-txt-3 text-sm resize-none outline-none leading-relaxed"
                rows={2}
              />
              {/* Mikrofon — placeholder transkrypcji (logika w kolejnym kroku) */}
              <button
                type="button"
                disabled
                title="Transkrypcja głosowa — wkrótce"
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-txt-3 cursor-not-allowed"
              >
                <MicIcon />
                <span className="text-xs">Transkrypcja głosowa — wkrótce</span>
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl font-semibold text-base transition-opacity bg-recovery text-bg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Zapisywanie…' : 'Zapisz wpis'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
