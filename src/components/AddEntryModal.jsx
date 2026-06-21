import { useState, useEffect } from 'react';
import CircularGauge from './CircularGauge';

const METRICS = [
  { key: 'mood',     label: 'Mood',     icon: '😊', color: '#22c55e', hint: 'wyżej = lepiej' },
  { key: 'recovery', label: 'Recovery', icon: '⚡', color: '#eab308', hint: 'wyżej = lepiej' },
  { key: 'sleep',    label: 'Sleep',    icon: '🌙', color: '#818cf8', hint: 'wyżej = lepiej' },
  { key: 'doms',     label: 'DOMS',     icon: '🔥', color: '#f97316', hint: 'niżej = lepiej' },
];

export default function AddEntryModal({ open, onClose, onSave }) {
  const [values, setValues] = useState({ mood: 5, recovery: 5, sleep: 5, doms: 3 });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ mood: 5, recovery: 5, sleep: 5, doms: 3 });
      setNote('');
      setSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...values, note: note.trim() });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet wrapper — full screen flex container for desktop centering */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center md:justify-center
          ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Sheet / dialog panel */}
        <div
          className={`w-full bg-[#111111] rounded-t-3xl transition-transform duration-300 ease-out
            md:w-[480px] md:rounded-3xl md:max-h-[90vh]
            ${open ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Handle (mobile) / Title + close (desktop) */}
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <div className="md:hidden w-10 h-1 bg-[#333] rounded-full mx-auto" />
            <p className="hidden md:block text-white font-semibold text-base">Nowy wpis</p>
            <button
              onClick={onClose}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[85vh] md:max-h-[80vh] px-4 pb-8 pt-3">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {METRICS.map(m => (
                <div key={m.key} className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col items-center gap-3">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-white text-sm font-semibold">{m.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-600">{m.hint}</span>
                  </div>
                  <CircularGauge value={values[m.key]} color={m.color} size={80} strokeWidth={8} />
                  <div className="w-full">
                    <input
                      type="range" min="1" max="10"
                      value={values[m.key]}
                      onChange={e => setValues(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                      className="w-full"
                      style={{ accentColor: m.color }}
                    />
                    <div className="flex justify-between text-gray-600 text-xs mt-1">
                      <span>1</span>
                      <span style={{ color: m.color }} className="font-bold">{values[m.key]}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl p-4 mb-4">
              <p className="text-gray-500 text-xs mb-2 font-medium">📝 NOTATKA</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Co dzisiaj czujesz? Jak był trening?"
                className="w-full bg-transparent text-white placeholder-gray-700 text-sm resize-none outline-none leading-relaxed"
                rows={3}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-all bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {saving ? 'Zapisywanie…' : 'Zapisz wpis'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
