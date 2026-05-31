import { useState } from 'react';
import { useEntries } from './hooks/useEntries';
import BottomNav from './components/BottomNav';
import AddEntry from './screens/AddEntry';
import LogList from './screens/LogList';
import Trends from './screens/Trends';

export default function App() {
  const [screen, setScreen] = useState('add');
  const { entries, addEntry, deleteEntry } = useEntries();

  return (
    <div className="relative bg-[#111111] min-h-screen max-w-md mx-auto">

      {/* Global app header */}
      <header className="px-4 pt-8 pb-3 border-b border-[#1e1e1e]">
        <h1 className="text-2xl font-bold text-white tracking-tight">SomaLog</h1>
        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
          Aplikacja do śledzenia subiektywnego samopoczucia i regeneracji potreningowej
        </p>
      </header>

      <div className="pb-24 overflow-y-auto">
        {screen === 'add'    && <AddEntry onSave={addEntry} onNavigate={setScreen} />}
        {screen === 'log'    && <LogList entries={entries} onDelete={deleteEntry} />}
        {screen === 'trends' && <Trends entries={entries} />}
      </div>

      <BottomNav current={screen} onChange={setScreen} />
    </div>
  );
}
