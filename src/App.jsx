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
import TrendsOverlay from './components/TrendsOverlay';
import Auth from './screens/Auth';

const DAYS = buildLast30Days();

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => toDateString(new Date()));
  const [showAddModal, setShowAddModal]  = useState(false);
  const [showTrends,   setShowTrends]    = useState(false);
  const [modulesOpen,  setModulesOpen]   = useState(false);

  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const userId = session?.user?.id ?? null;
  const { entries, entriesByDate, saveEntry, deleteEntry } = useEntries(userId);

  if (authLoading) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-sm">Ładowanie…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-[#111111] min-h-screen max-w-md mx-auto">
        <Auth onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  const selectedEntry = entriesByDate.get(selectedDate) ?? null;

  const handleSave = async (data) => {
    // Zapis dotyczy wybranego dnia (dashboard dnia), nie zawsze „dziś".
    await saveEntry(selectedDate, data);
    setShowAddModal(false);
  };

  // Zapis samej notatki (edycja inline w podglądzie dnia) — zachowuje pozostałe parametry.
  const handleSaveNote = async (note) => {
    if (!selectedEntry) return;
    const { mood, recovery, sleep, doms } = selectedEntry;
    await saveEntry(selectedDate, { mood, recovery, sleep, doms, note });
  };

  return (
    <AppLayout
      modulesOpen={modulesOpen}
      onToggleModules={() => setModulesOpen(o => !o)}
      header={
        <Header
          onTrendsClick={() => setShowTrends(true)}
          onSignOut={signOut}
        />
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
          selectedDate={selectedDate}
          onAddClick={() => setShowAddModal(true)}
          onDelete={deleteEntry}
          onSaveNote={handleSaveNote}
        />
      }
      inputBar={
        <InputBar />
      }
      modals={
        <>
          <AddEntryModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleSave}
            initialEntry={selectedEntry}
            selectedDate={selectedDate}
          />
          <TrendsOverlay
            open={showTrends}
            onClose={() => setShowTrends(false)}
            entries={entries}
          />
        </>
      }
    />
  );
}
