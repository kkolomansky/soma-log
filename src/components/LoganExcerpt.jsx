import { useState } from 'react';
import { AiIcon, RefreshIcon } from './icons';
import { LogoMark } from './Logo';
import SpeakButton from './SpeakButton';

function Spinner({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="animate-spin"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </svg>
  );
}

// Kompaktowy moduł obok zegara regeneracji: wyciąg analizy Logana + odświeżanie + głos (leo).
export default function LoganExcerpt({ short, onAnalyze }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasShort = short && short.trim().length > 0;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await onAnalyze();
    } catch (e) {
      setError(e.message || 'Nie udało się wygenerować analizy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col pl-3 border-l border-divider min-w-0">
      <p className="flex items-center gap-1 text-txt-3 text-[10px] font-semibold uppercase mb-1">
        <span className="text-ai shrink-0"><AiIcon size={12} /></span>
        <span className="break-words leading-tight">Podsumowanie Logana</span>
      </p>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center gap-2 text-txt-3 text-[11px]">
            <LogoMark size={20} thinking className="shrink-0" /> Logan analizuje…
          </div>
        ) : hasShort ? (
          <p className="text-txt-2 text-[11px] leading-snug line-clamp-4 break-words text-justify">{short}</p>
        ) : (
          <p className="text-txt-3 text-[11px] leading-snug">
            Kliknij odśwież, aby Logan ocenił ten dzień.
          </p>
        )}
        {error && <p className="text-danger text-[10px] mt-1 leading-snug">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-0.5 mt-1">
        <button
          onClick={refresh}
          disabled={loading}
          title="Odśwież analizę"
          aria-label="Odśwież analizę"
          className="w-7 h-7 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-elevated transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner /> : <RefreshIcon size={14} />}
        </button>
        <SpeakButton text={short} onError={setError} />
      </div>
    </div>
  );
}
