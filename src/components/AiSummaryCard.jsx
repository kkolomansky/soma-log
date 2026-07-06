import { useState, useRef, useEffect } from 'react';
import { AiIcon, RefreshIcon } from './icons';
import ThinkingIndicator from './ThinkingIndicator';
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

// Okno pod notatką: pełna, rozbudowana analiza Logana dla danego dnia. Na żądanie.
// Ładowanie/analiza sterowane z DayView (współdzielone z wyciągiem), tekst „pisze się"
// po zakończeniu analizy (playKey).
export default function AiSummaryCard({ summary, onAnalyze, loading = false, error = null, playKey = 0 }) {
  const [speakError, setSpeakError] = useState(null);
  const scrollRef = useRef(null);
  const hasSummary = summary && summary.trim().length > 0;
  const shown = useTypewriter(summary || '', playKey);

  // Podczas „pisania" trzymaj widok przy najnowszym tekście.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shown]);

  const shownError = error || speakError;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-1.5 text-txt-3 text-xs font-medium uppercase tracking-wide">
          <span className="text-ai"><AiIcon size={14} /></span>
          Analiza Logana
        </p>
        {hasSummary && !loading && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={onAnalyze}
              disabled={loading}
              title="Odśwież analizę"
              aria-label="Odśwież analizę"
              className="w-7 h-7 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-elevated transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner /> : <RefreshIcon size={14} />}
            </button>
            <SpeakButton text={summary} onError={setSpeakError} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-2">
          <ThinkingIndicator label="Logan analizuje dzień…" />
        </div>
      ) : hasSummary ? (
        <div ref={scrollRef} className="max-h-[90px] overflow-y-auto pr-2">
          <p className="text-txt-2 text-[11px] leading-relaxed whitespace-pre-wrap break-words md:text-justify">{shown}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-1">
          <p className="text-txt-3 text-[11px] leading-relaxed">
            Poproś Logana o ocenę stanu z tego dnia i wskazówki, co poprawić.
          </p>
          <button
            onClick={onAnalyze}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ai/15 text-ai text-sm font-semibold hover:bg-ai/25 active:scale-95 transition-all"
          >
            <AiIcon size={16} /> Analizuj dzień
          </button>
        </div>
      )}

      {shownError && <p className="text-danger text-xs mt-2 text-center">{shownError}</p>}
    </div>
  );
}
