import { useState } from 'react';
import { AiIcon, RefreshIcon } from './icons';
import { LogoMark } from './Logo';
import SpeakButton from './SpeakButton';
import { useTypewriter } from '../hooks/useTypewriter';

function Spinner({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="animate-spin"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </svg>
  );
}

// Kompaktowy moduł obok zegara regeneracji: wyciąg analizy Logana + odświeżanie + głos (leo).
// Ładowanie/analiza sterowane z DayView; wyciąg „pisze się" po zakończeniu analizy (playKey).
export default function LoganExcerpt({ short, onAnalyze, loading = false, error = null, playKey = 0 }) {
  const [speakError, setSpeakError] = useState(null);
  const hasShort = short && short.trim().length > 0;
  const shown = useTypewriter(short || '', playKey);
  const shownError = error || speakError;

  return (
    <div className="h-full flex flex-col pl-3 border-l border-divider min-w-0">
      <p className="flex items-center gap-1 text-txt-3 text-[10px] font-semibold uppercase mb-1">
        <span className="text-ai shrink-0"><AiIcon size={12} /></span>
        <span className="break-words leading-tight">Podsumowanie Logana</span>
      </p>

      <div className="flex-1 min-h-0">
        {loading ? (
          // Task 8: większe i odsunięte na dół, by było bardziej widoczne.
          <div className="h-full flex flex-col items-center justify-center gap-2 pt-4 text-txt-2 text-[13px] text-center">
            <LogoMark size={30} thinking className="shrink-0" />
            <span className="leading-tight">Logan analizuje…</span>
          </div>
        ) : hasShort ? (
          <p className="text-txt-2 text-[11px] leading-snug line-clamp-4 break-words md:text-justify">{shown}</p>
        ) : (
          <p className="text-txt-3 text-[11px] leading-snug">
            Kliknij odśwież, aby Logan ocenił ten dzień.
          </p>
        )}
        {shownError && <p className="text-danger text-[10px] mt-1 leading-snug">{shownError}</p>}
      </div>

      <div className="flex items-center justify-end gap-0.5 mt-1">
        <button
          onClick={onAnalyze}
          disabled={loading}
          title="Odśwież analizę"
          aria-label="Odśwież analizę"
          className="w-7 h-7 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-elevated transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner /> : <RefreshIcon size={14} />}
        </button>
        <SpeakButton text={short} onError={setSpeakError} />
      </div>
    </div>
  );
}
