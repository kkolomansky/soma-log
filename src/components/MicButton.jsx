import { useDictation } from '../hooks/useDictation';

function MicIcon({ size = 16 }) {
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

function Spinner({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="animate-spin"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </svg>
  );
}

// Przycisk dyktowania „przytrzymaj i mów" — transkrypcja na żywo (Web Speech API).
// getText() → bieżąca treść pola (baza); onText(joined, isFinal) → aktualizacja pola.
export default function MicButton({ getText, onText, size = 32, iconSize = 16, className = '' }) {
  const { listening, transcribing, error, start, stop } = useDictation({ getText, onText });

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start();
  };
  const onPointerUp = () => stop();

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      disabled={transcribing}
      title={error || (listening ? 'Puść, aby zakończyć' : 'Przytrzymaj i mów')}
      aria-label="Dyktuj głosem (przytrzymaj)"
      style={{ width: size, height: size, touchAction: 'none' }}
      className={`rounded-full flex items-center justify-center shrink-0 transition-colors select-none ${
        listening
          ? 'bg-danger/20 text-danger animate-pulse'
          : error
          ? 'bg-elevated text-danger'
          : 'bg-elevated text-txt-3 hover:text-txt'
      } disabled:opacity-60 ${className}`}
    >
      {transcribing ? <Spinner size={iconSize} /> : <MicIcon size={iconSize} />}
    </button>
  );
}
