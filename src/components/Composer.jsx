import { useRef, useEffect } from 'react';
import { useVoiceTranscription } from '../hooks/useVoiceTranscription';
import { useAutoGrow } from '../hooks/useAutoGrow';

function MicIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SendIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Spinner({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="animate-spin"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </svg>
  );
}

// Wspólny composer czatu: tekst (auto-wzrost 1→4 linie, potem scroll) + mikrofon + wyślij.
// Pusty stan = 1 wiersz (długi placeholder nie podbija paska). Czcionka text-xs.
export default function Composer({
  value,
  onChange,
  onSend,
  sending = false,
  autoFocus = false,
  onActivate,
  placeholder = 'Napisz do Logana…',
}) {
  const taRef = useRef(null);
  useAutoGrow(taRef, value, 4);

  const { recording, transcribing, error: micError, toggle } = useVoiceTranscription(
    (text) => onChange(value ? `${value} ${text}` : text),
  );

  useEffect(() => {
    if (autoFocus && taRef.current) taRef.current.focus();
  }, [autoFocus]);

  const canSend = value.trim().length > 0 && !sending;
  const submit = () => { if (canSend) onSend(value.trim()); };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div>
      <div className="flex items-end gap-1.5 bg-surface border border-border rounded-2xl px-3 py-2">
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onActivate}
          rows={1}
          placeholder={placeholder}
          className="flex-1 self-center bg-transparent text-txt placeholder-txt-3 text-[13px] outline-none resize-none leading-relaxed py-1 max-h-40"
        />
        <button
          type="button"
          onClick={toggle}
          disabled={transcribing || sending}
          title={recording ? 'Zatrzymaj nagrywanie' : 'Nagraj głos'}
          aria-label={recording ? 'Zatrzymaj nagrywanie' : 'Nagraj głos'}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            recording
              ? 'bg-danger/20 text-danger animate-pulse'
              : 'bg-elevated text-txt-3 hover:text-txt'
          } disabled:opacity-50`}
        >
          {transcribing ? <Spinner size={16} /> : <MicIcon size={16} />}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          title="Wyślij"
          aria-label="Wyślij"
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-recovery text-bg hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
        >
          <SendIcon size={16} />
        </button>
      </div>
      {micError && <p className="text-danger text-xs mt-1 px-1">{micError}</p>}
    </div>
  );
}
