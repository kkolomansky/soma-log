import { useRef, useEffect } from 'react';
import Composer from './Composer';
import ThinkingIndicator from './ThinkingIndicator';
import { LogoMark } from './Logo';
import { formatFullDate } from '../utils/dateUtils';

function CloseIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-justify ${
          isUser
            ? 'bg-recovery/15 text-txt rounded-br-md'
            : 'bg-surface border border-border text-txt-2 rounded-bl-md'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

// Sheet rozmowy z agentem dla wybranego dnia — wywoływany kliknięciem dolnego paska.
export default function ChatPanel({
  open, onClose, dateStr, messages, sending, error,
  draft, onDraftChange, onSend,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, sending]);

  return (
    <>
      {/* Tło */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bg-bg border-t border-border rounded-t-3xl
          h-[80vh] max-w-3xl mx-auto transition-transform duration-300 ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        {/* Nagłówek */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-divider">
          <LogoMark size={28} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-txt font-display font-semibold text-sm leading-tight">Logan</p>
            <p className="text-txt-3 text-xs leading-tight capitalize truncate">{formatFullDate(dateStr)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij rozmowę"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-elevated transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Wiadomości */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && !sending && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
              <LogoMark size={44} />
              <p className="text-txt-2 text-sm font-medium">Porozmawiaj o tym dniu</p>
              <p className="text-txt-3 text-xs leading-relaxed max-w-xs">
                Logan widzi Twoje dzisiejsze parametry i notatkę. Zapytaj o stan,
                regenerację albo o to, co poprawić.
              </p>
            </div>
          )}

          {messages.map(m => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5">
                <ThinkingIndicator label="Trener analizuje…" />
              </div>
            </div>
          )}

          {error && <p className="text-danger text-xs text-center">{error}</p>}
        </div>

        {/* Composer */}
        <div className="shrink-0 px-3 pt-2 pb-3 border-t border-divider">
          <Composer
            value={draft}
            onChange={onDraftChange}
            onSend={onSend}
            sending={sending}
            autoFocus={open}
          />
        </div>
      </div>
    </>
  );
}
