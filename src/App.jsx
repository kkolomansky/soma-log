import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { toDateString, buildLast30Days } from './utils/dateUtils';
import AppLayout from './layouts/AppLayout';
import Header from './components/Header';
import DayStrip from './components/DayStrip';
import DayView from './components/DayView';
import InputBar from './components/InputBar';
import AddEntryModal from './components/AddEntryModal';
import Auth from './screens/Auth';

const DAYS = buildLast30Days();

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => toDateString(new Date()));
  const [showAddModal, setShowAddModal]  = useState(false);
  const [editFocusKey, setEditFocusKey]  = useState(null);
  const [modulesOpen,  setModulesOpen]   = useState(false);

  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const userId = session?.user?.id ?? null;
  const { entries, entriesByDate, saveEntry, deleteEntry } = useEntries(userId);

  if (authLoading) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center">
        <p className="text-txt-3 text-sm">Ładowanie…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-bg min-h-screen max-w-md mx-auto">
        <Auth onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  // Otwiera modal dodawania/edycji; opcjonalny klucz parametru → przewinięcie do niego.
  const handleAddClick = (key = null) => {
    setEditFocusKey(typeof key === 'string' ? key : null);
    setShowAddModal(true);
  };

  const selectedEntry = entriesByDate.get(selectedDate) ?? null;

  const handleSave = async (data) => {
    // Zapis dotyczy wybranego dnia (dashboard dnia), nie zawsze „dziś".
    await saveEntry(selectedDate, data);
    setShowAddModal(false);
  };

  // Zapis samej notatki (edycja inline w podglądzie dnia) — zachowuje pozostałe parametry.
  const handleSaveNote = async (note) => {
    if (!selectedEntry) return;
    const { sleep, energy, motivation, fatigue, doms, stress } = selectedEntry;
    await saveEntry(selectedDate, { sleep, energy, motivation, fatigue, doms, stress, note });
  };

  return (
    <AppLayout
      modulesOpen={modulesOpen}
      onToggleModules={() => setModulesOpen(o => !o)}
      header={
        <Header onSignOut={signOut} />
      }
      dayStrip={
        <DayStrip
          days={DAYS}
          selectedDate={selectedDate}
          entriesByDate={entriesByDate}
          onSelect={setSelectedDate}
        />
      }
      dayView={
        <DayView
          entry={selectedEntry}
          days={DAYS}
          selectedDate={selectedDate}
          entries={entries}
          onSelect={setSelectedDate}
          onAddClick={handleAddClick}
          onDelete={deleteEntry}
          onSaveNote={handleSaveNote}
        />
      }
      inputBar={
        <InputBar />
      }
      modals={
        <AddEntryModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
          initialEntry={selectedEntry}
          selectedDate={selectedDate}
          focusKey={editFocusKey}
        />
      }
    />
  );
}
