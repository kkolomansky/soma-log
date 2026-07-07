import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { useChat } from './hooks/useChat';
import { summarizeDay } from './lib/agent';
import { RATE_LIMIT_EVENT } from './lib/usage';
import { loadVoiceFromServer } from './lib/voice';
import { initFontScale } from './lib/fontScale';
import { toDateString, buildLast30Days, buildDayRange } from './utils/dateUtils';
import AppLayout from './layouts/AppLayout';
import Header from './components/Header';
import DayStrip from './components/DayStrip';
import DayView from './components/DayView';
import InputBar from './components/InputBar';
import ChatPanel from './components/ChatPanel';
import AddEntryModal from './components/AddEntryModal';
import SettingsPanel from './components/SettingsPanel';
import ConfirmModal from './components/ConfirmModal';
import DateRangePicker from './components/DateRangePicker';
import Auth from './screens/Auth';
import ResetPassword from './screens/ResetPassword';
import Docs from './screens/Docs';
import { useRoute } from './lib/nav';

const DEFAULT_DAYS = buildLast30Days();

export default function App() {
  const path = useRoute();
  const [selectedDate, setSelectedDate] = useState(() => toDateString(new Date()));
  const [showAddModal, setShowAddModal]  = useState(false);
  const [editFocusKey, setEditFocusKey]  = useState(null);
  const [modulesOpen,  setModulesOpen]   = useState(false);
  const [showChat,     setShowChat]      = useState(false);
  const [showSettings, setShowSettings]  = useState(false);
  const [settingsView, setSettingsView]  = useState('menu');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [draft,        setDraft]         = useState('');
  // Wybrany okres karuzeli: null = domyślnie ostatni miesiąc; { start, end } = filtr.
  const [range,        setRange]         = useState(null);
  const [showRangePicker, setShowRangePicker] = useState(false);

  // Zakres dni karuzeli: domyślnie ostatnie 30 dni, albo wybrany okres (filtruje do zakresu).
  const DAYS = useMemo(
    () => (range ? buildDayRange(range.start, range.end) : DEFAULT_DAYS),
    [range],
  );

  const { session, loading: authLoading, recovery, clearRecovery, signIn, signUp, signOut, signInWithGoogle } = useAuth();
  const userId = session?.user?.id ?? null;
  const { entries, entriesByDate, saveEntry, updateSummary, deleteEntry } = useEntries(userId);
  const { messages, sending, error: chatError, sendMessage } = useChat(userId, selectedDate);

  // Zmiana dnia → czysty composer i zamknięta rozmowa (wątek ładuje się dla nowego dnia).
  useEffect(() => { setDraft(''); setShowChat(false); }, [selectedDate]);

  // Zastosuj zapisaną skalę czcionki (czytelność, zwłaszcza mobile) przy starcie.
  useEffect(() => { initFontScale(); }, []);

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

  // Tryb odzyskiwania hasła (wejście z linku z e-maila) — ma priorytet nad zwykłym widokiem.
  if (recovery) {
    return (
      <div className="bg-bg min-h-screen max-w-md mx-auto">
        <ResetPassword onDone={clearRecovery} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-bg min-h-screen max-w-md mx-auto">
        <Auth onSignIn={signIn} onSignUp={signUp} onSignInWithGoogle={signInWithGoogle} />
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
  // Inline zapis z podglądu dnia: notatka + zdjęcia razem (NoteCard zarządza obydwoma).
  const handleSaveNote = async ({ note, photos }) => {
    if (!selectedEntry) return;
    const { sleep, energy, motivation, fatigue, doms, stress } = selectedEntry;
    await saveEntry(selectedDate, { sleep, energy, motivation, fatigue, doms, stress, note, photos });
  };

  // Wysłanie wiadomości do agenta — czyści composer i otwiera rozmowę dnia.
  const handleSend = (text) => {
    setDraft('');
    setShowChat(true);
    sendMessage(text);
  };

  // Wybór okresu z kalendarza → filtruj karuzelę do zakresu i wyśrodkuj na dacie końca.
  const handleApplyRange = (start, end) => {
    setRange({ start, end });
    setSelectedDate(end);
    setShowRangePicker(false);
  };

  // Powrót do domyślnego widoku (ostatni miesiąc) + dziś.
  const handleResetRange = () => {
    setRange(null);
    setSelectedDate(toDateString(new Date()));
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
        <Header onSignOut={() => setConfirmLogout(true)} onOpenSettings={() => { setSettingsView('menu'); setShowSettings(true); }} />
      }
      dayStrip={
        <DayStrip
          days={DAYS}
          selectedDate={selectedDate}
          entriesByDate={entriesByDate}
          onSelect={setSelectedDate}
          hasCustomRange={!!range}
          onOpenRange={() => setShowRangePicker(true)}
          onResetRange={handleResetRange}
        />
      }
      dayView={
        <DayView
          entry={selectedEntry}
          days={DAYS}
          selectedDate={selectedDate}
          entries={entries}
          userId={userId}
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
            userId={userId}
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
            user={session?.user}
            onSignOut={signOut}
          />
          <DateRangePicker
            open={showRangePicker}
            onClose={() => setShowRangePicker(false)}
            onApply={handleApplyRange}
            initialStart={range?.start}
            initialEnd={range?.end}
          />
          <ConfirmModal
            open={confirmLogout}
            title="Wylogować się?"
            message="Czy na pewno chcesz się wylogować?"
            confirmLabel="Wyloguj"
            cancelLabel="Anuluj"
            tone="primary"
            onCancel={() => setConfirmLogout(false)}
            onConfirm={() => { setConfirmLogout(false); signOut(); }}
          />
        </>
      }
    />
  );
}
