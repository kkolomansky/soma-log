import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Composer from './Composer';
import ThinkingIndicator from './ThinkingIndicator';
import { LogoMark } from './Logo';
import { formatFullDate } from '../utils/dateUtils';

// Mapowanie elementów markdown na style dopasowane do bąbla czatu (12px, tokeny designu).
// Logan odpowiada w markdownie (**pogrubienia**, # nagłówki, listy) — bez tego widać surowe znaki.
const mdComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-txt">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="font-display font-semibold text-txt text-[13px] mt-2 mb-1 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="font-display font-semibold text-txt text-[12.5px] mt-2 mb-1 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="font-display font-semibold text-txt text-[12px] mt-1.5 mb-1 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="marker:text-txt-3">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-recovery underline break-all">{children}</a>
  ),
  code: ({ children }) => (
    <code className="bg-elevated rounded px-1 py-0.5 text-[11px] font-mono">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-elevated rounded-lg p-2 my-2 overflow-x-auto text-[11px] [&_code]:bg-transparent [&_code]:p-0">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-2 my-2 text-txt-3">{children}</blockquote>
  ),
  hr: () => <hr className="border-divider my-2" />,
};

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
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed break-words ${
          isUser
            ? 'whitespace-pre-wrap md:text-justify bg-recovery/15 text-txt rounded-br-md'
            : 'bg-surface border border-border text-txt-2 rounded-bl-md'
        }`}
      >
        {isUser
          ? content
          : <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{content}</ReactMarkdown>}
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
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bg-bg border-x border-t border-border rounded-t-3xl shadow-2xl shadow-black/40
          h-[80vh] max-w-3xl mx-auto transition-transform duration-300 ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        {/* Nagłówek */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-divider">
          <LogoMark size={28} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-txt font-display font-semibold text-[12px] leading-tight">Logan</p>
            <p className="text-txt-3 text-[10px] leading-tight capitalize truncate">{formatFullDate(dateStr)}</p>
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
              <p className="text-txt-2 text-[12px] font-medium">Porozmawiaj o tym dniu</p>
              <p className="text-txt-3 text-[10px] leading-relaxed max-w-xs">
                Logan widzi Twoje dzisiejsze parametry i notatkę. Zapytaj o stan,
                regenerację albo o to, co poprawić.
              </p>
            </div>
          )}

          {messages.map(m => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}

          {/* Wskaźnik „myślenia" tylko dopóki nie zacznie napływać strumień odpowiedzi
              (gdy ostatnia wiadomość to już odpowiedź Logana, pokazuje się jej treść). */}
          {sending && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5">
                <ThinkingIndicator label="Logan analizuje…" textClass="text-[12px]" />
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
