import Composer from './Composer';

// Dolny pasek = wejście do rozmowy z trenerem AI dla wybranego dnia.
// Kliknięcie/fokus przywołuje konwersację (ChatPanel); pisanie i mikrofon działają od razu.
// Gdy panel rozmowy jest otwarty (`hidden`), pasek znika — composer żyje wtedy w panelu,
// więc nie ma zdublowanego pola wpisu.
export default function InputBar({ draft, onDraftChange, onSend, sending, onOpenChat, hidden = false }) {
  if (hidden) return null;
  return (
    <div className="shrink-0 bg-bg border-t border-divider py-3 overflow-y-auto [scrollbar-gutter:stable_both-edges]">
      <div className="max-w-3xl mx-auto px-3 w-full" onClick={onOpenChat}>
        <Composer
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
          sending={sending}
          onActivate={onOpenChat}
          placeholder="Zapytaj Logana o ten dzień…"
        />
      </div>
    </div>
  );
}
