import { useState, useEffect } from 'react';
import { formatFullDate } from '../utils/dateUtils';
import Slider from './Slider';

const METRICS = [
  { key: 'mood',     label: 'Mood',     icon: '😊', color: '#22c55e', hint: 'wyżej = lepiej' },
  { key: 'recovery', label: 'Recovery', icon: '⚡', color: '#eab308', hint: 'wyżej = lepiej' },
  { key: 'sleep',    label: 'Sleep',    icon: '🌙', color: '#818cf8', hint: 'wyżej = lepiej' },
  { key: 'doms',     label: 'DOMS',     icon: '🔥', color: '#f97316', hint: 'niżej = lepiej' },
];

const DEFAULTS = { mood: 50, recovery: 50, sleep: 50, doms: 30 };

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

export default function AddEntryModal({ open, onClose, onSave, initialEntry = null, selectedDate }) {
  const [values, setValues] = useState(DEFAULTS);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Edycja istniejącego dnia → prefill jego wartościami; nowy wpis → wartości domyślne.
      setValues(initialEntry
        ? { mood: initialEntry.mood, recovery: initialEntry.recovery, sleep: initialEntry.sleep, doms: initialEntry.doms }
        : DEFAULTS);
      setNote(initialEntry?.note ?? '');
      setSaving(false);
    }
  }, [open, initialEntry]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...values, note: note.trim() });
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
          className={`w-full bg-[#111111] rounded-t-3xl transition-[transform,opacity] duration-300 ease-out
            md:w-[420px] md:rounded-3xl md:max-h-[90vh]
            ${open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 invisible'}`}
        >
          {/* Uchwyt (mobile) + data na górze + X */}
          <div className="relative flex items-center justify-center px-4 pt-5 pb-2">
            <div className="md:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 bg-[#333] rounded-full" />
            <p className="text-white font-semibold text-base capitalize">{dateLabel}</p>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="absolute right-3 top-3 flex items-center justify-center w-8 h-8 rounded-full bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[80vh] px-4 pb-7 pt-2">
            {/* Lista parametrów: etykieta z lewej, suwak + wartość z prawej */}
            <div className="bg-[#1c1c1e] rounded-2xl px-4 divide-y divide-[#2a2a2a] mb-3">
              {METRICS.map(m => (
                <div key={m.key} className="flex items-center gap-3 py-3">
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <span className="text-base">{m.icon}</span>
                    <span className="text-white text-sm font-medium">{m.label}</span>
                  </div>
                  <Slider
                    value={values[m.key]}
                    onChange={e => setValues(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                    className="flex-1 min-w-0"
                  />
                  <span className="w-9 text-right text-sm font-bold tabular-nums" style={{ color: m.color }}>
                    {values[m.key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Notatka */}
            <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-3">
              <p className="text-gray-500 text-xs mb-2 font-medium uppercase tracking-wide">Notatka</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Co dzisiaj czujesz? Jak był trening?"
                className="w-full bg-transparent text-white placeholder-gray-700 text-sm resize-none outline-none leading-relaxed"
                rows={2}
              />
              {/* Mikrofon — placeholder transkrypcji (logika w kolejnym kroku) */}
              <button
                type="button"
                disabled
                title="Transkrypcja głosowa — wkrótce"
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#2a2a2a] text-gray-600 cursor-not-allowed"
              >
                <MicIcon />
                <span className="text-xs">Transkrypcja głosowa — wkrótce</span>
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl font-semibold text-base transition-all border border-[#2a2a2a] bg-transparent text-white hover:bg-[#1c1c1e] disabled:opacity-50"
            >
              {saving ? 'Zapisywanie…' : 'Zapisz wpis'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
