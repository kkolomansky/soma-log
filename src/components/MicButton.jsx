import { useVoiceTranscription } from '../hooks/useVoiceTranscription';

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

// Okrągły przycisk mikrofonu z transkrypcją głosową (xAI STT).
// onResult(text) → np. dopisanie tekstu do notatki/pola.
export default function MicButton({ onResult, size = 32, iconSize = 16, className = '' }) {
  const { recording, transcribing, error, toggle } = useVoiceTranscription(onResult);
  const busy = transcribing;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={error || (recording ? 'Zatrzymaj nagrywanie' : 'Dyktuj notatkę głosem')}
      aria-label={recording ? 'Zatrzymaj nagrywanie' : 'Dyktuj głosem'}
      style={{ width: size, height: size }}
      className={`rounded-full flex items-center justify-center shrink-0 transition-colors ${
        recording
          ? 'bg-danger/20 text-danger animate-pulse'
          : error
          ? 'bg-elevated text-danger'
          : 'bg-elevated text-txt-3 hover:text-txt'
      } disabled:opacity-60 ${className}`}
    >
      {busy ? <Spinner size={iconSize} /> : <MicIcon size={iconSize} />}
    </button>
  );
}
