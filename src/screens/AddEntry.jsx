import { useState } from 'react';
import CircularGauge from '../components/CircularGauge';

const METRICS = [
  { key: 'mood',     label: 'Mood',     icon: '😊', color: '#22c55e', hint: 'wyżej = lepiej' },
  { key: 'recovery', label: 'Recovery', icon: '⚡', color: '#eab308', hint: 'wyżej = lepiej' },
  { key: 'sleep',    label: 'Sleep',    icon: '🌙', color: '#818cf8', hint: 'wyżej = lepiej' },
  { key: 'doms',     label: 'DOMS',     icon: '🔥', color: '#f97316', hint: 'niżej = lepiej' },
];

export default function AddEntry({ onSave, onNavigate }) {
  const [values, setValues] = useState({ mood: 5, recovery: 5, sleep: 5, doms: 3 });
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ ...values, note: note.trim() });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setValues({ mood: 5, recovery: 5, sleep: 5, doms: 3 });
      setNote('');
      onNavigate('trends');
    }, 1000);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="px-4 pt-10 pb-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Nowy wpis</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{dateStr}</p>
      </div>

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

            <CircularGauge value={values[m.key]} color={m.color} size={88} strokeWidth={8} />

            <div className="w-full">
              <input
                type="range"
                min="1"
                max="10"
                value={values[m.key]}
                onChange={e => setValues(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                className="w-full"
                style={{ accentColor: m.color }}
              />
              <div className="flex justify-between text-gray-600 text-xs mt-1 px-0.5">
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
        disabled={saved}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300"
        style={{
          backgroundColor: saved ? '#16a34a' : '#ffffff',
          color: saved ? '#ffffff' : '#000000',
        }}
      >
        {saved ? '✓ Zapisano!' : 'Zapisz wpis'}
      </button>
    </div>
  );
}
