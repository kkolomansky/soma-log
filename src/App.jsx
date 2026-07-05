import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { useChat } from './hooks/useChat';
import { summarizeDay } from './lib/agent';
import { RATE_LIMIT_EVENT } from './lib/usage';
import { loadVoiceFromServer } from './lib/voice';
import { toDateString, buildLast30Days } from './utils/dateUtils';
import AppLayout from './layouts/AppLayout';
import Header from './components/Header';
import DayStrip from './components/DayStrip';
import DayView from './components/DayView';
import InputBar from './components/InputBar';
import ChatPanel from './components/ChatPanel';
import AddEntryModal from './components/AddEntryModal';
import SettingsPanel from './components/SettingsPanel';
import Auth from './screens/Auth';
import Docs from './screens/Docs';
import { useRoute } from './lib/nav';

const DAYS = buildLast30Days();

export default function App() {
  const path = useRoute();
  const [selectedDate, setSelectedDate] = useState(() => toDateString(new Date()));
  const [showAddModal, setShowAddModal]  = useState(false);
  const [editFocusKey, setEditFocusKey]  = useState(null);
  const [modulesOpen,  setModulesOpen]   = useState(false);
  const [showChat,     setShowChat]      = useState(false);
  const [showSettings, setShowSettings]  = useState(false);
  const [settingsView, setSettingsView]  = useState('menu');
  const [draft,        setDraft]         = useState('');

  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const userId = session?.user?.id ?? null;
  const { entries, entriesByDate, saveEntry, updateSummary, deleteEntry } = useEntries(userId);
  const { messages, sending, error: chatError, sendMessage } = useChat(userId, selectedDate);

  // Zmiana dnia → czysty composer i zamknięta rozmowa (wątek ładuje się dla nowego dnia).
  useEffect(() => { setDraft(''); setShowChat(false); }, [selectedDate]);

  // Po zalogowaniu wczytaj zapisany na koncie głos Logana do lokalnego cache (trwałość między sesjami).
  useEffect(() => { if (userId) loadVoiceFromServer(); }, [userId]);

  // Po wyczerpaniu dziennego limitu (429 z dowolnego zapytania do Logana) otwórz panel na „Limity zapytań".
  useEffect(() => {
    const onLimited = () => { setSettingsView('usage'); setShowSettings(true); };
    window.addEventListener(RATE_LIMIT_EVENT, onLimited);
    return () => window.removeEventListener(RATE_LIMIT_EVENT, onLimited);
  }, []);

  // Publiczna dokumentacja (API + MCP) — dostępna pod /docs niezależnie od logowania.
  if (path.startsWith('/docs')) return <Docs session={session} />;

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

  // Wysłanie wiadomości do agenta — czyści composer i otwiera rozmowę dnia.
  const handleSend = (text) => {
    setDraft('');
    setShowChat(true);
    sendMessage(text);
  };

  // „Analizuj dzień" → analiza Logana (pełna + skrót) zapisana w soma_entries.
  const handleAnalyze = async () => {
    const { full, short } = await summarizeDay({ entryDate: selectedDate });
    await updateSummary(selectedDate, { full, short });
  };

  return (
    <AppLayout
      modulesOpen={modulesOpen}
      onToggleModules={() => setModulesOpen(o => !o)}
      header={
        <Header onSignOut={signOut} onOpenSettings={() => { setSettingsView('menu'); setShowSettings(true); }} />
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
          onAnalyze={handleAnalyze}
        />
      }
      inputBar={
        <InputBar
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          sending={sending}
          onOpenChat={() => setShowChat(true)}
          hidden={showChat}
        />
      }
      modals={
        <>
          <AddEntryModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleSave}
            initialEntry={selectedEntry}
            selectedDate={selectedDate}
            focusKey={editFocusKey}
          />
          <ChatPanel
            open={showChat}
            onClose={() => setShowChat(false)}
            dateStr={selectedDate}
            messages={messages}
            sending={sending}
            error={chatError}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
          />
          <SettingsPanel
            open={showSettings}
            onClose={() => setShowSettings(false)}
            initialView={settingsView}
            email={session?.user?.email}
          />
        </>
      }
    />
  );
}
