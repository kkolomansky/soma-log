import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import BottomNav from './components/BottomNav';
import AddEntry from './screens/AddEntry';
import LogList from './screens/LogList';
import Trends from './screens/Trends';
import Auth from './screens/Auth';

export default function App() {
  const [screen, setScreen] = useState('add');
  const { session, loading, signIn, signUp, signOut } = useAuth();
  const userId = session?.user?.id ?? null;
  const { entries, addEntry, deleteEntry } = useEntries(userId);

  if (loading) {
    return (
      <div className="bg-[#111111] min-h-screen max-w-md mx-auto flex items-center justify-center">
        <p className="text-gray-600 text-sm">Ładowanie…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative bg-[#111111] min-h-screen max-w-md mx-auto">
        <Auth onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  return (
    <div className="relative bg-[#111111] min-h-screen max-w-md mx-auto">

      {/* Global app header */}
      <header className="px-4 pt-8 pb-3 border-b border-[#1e1e1e] flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SomaLog</h1>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            Aplikacja do śledzenia subiektywnego samopoczucia i regeneracji potreningowej
          </p>
        </div>
        <button
          onClick={signOut}
          className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-[#2a2a2a]"
        >
          wyloguj
        </button>
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
