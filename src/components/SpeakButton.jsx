import { useState, useRef, useEffect } from 'react';
import { SpeakerIcon, StopIcon } from './icons';
import { speak } from '../lib/agent';

function Spinner({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="animate-spin"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </svg>
  );
}

// Przycisk odczytu na głos (xAI TTS, głos leo „Jarvis"). Współdzielony przez
// „Podsumowanie Logana" i „Analiza Logana". Odtwarza przekazany `text`.
export default function SpeakButton({ text, onError, className = '' }) {
  const [state, setState] = useState('idle'); // idle | loading | playing
  const audioRef = useRef(null);
  const hasText = text && text.trim().length > 0;

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const toggle = async () => {
    if (state !== 'idle') {
      audioRef.current?.pause();
      audioRef.current = null;
      setState('idle');
      return;
    }
    if (!hasText) return;
    setState('loading');
    onError?.(null);
    try {
      const blob = await speak(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setState('idle'); audioRef.current = null; URL.revokeObjectURL(url); };
      await audio.play();
      setState('playing');
    } catch (e) {
      onError?.(e.message || 'Nie udało się odczytać tekstu.');
      setState('idle');
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!hasText}
      title={state === 'idle' ? 'Odczytaj głosem Jarvisa' : 'Zatrzymaj odczyt'}
      aria-label="Odczytaj analizę głosem"
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
        state === 'playing' ? 'text-ai bg-ai/10' : 'text-txt-3 hover:text-txt hover:bg-elevated'
      } ${className}`}
    >
      {state === 'loading' ? <Spinner /> : state === 'playing' ? <StopIcon size={14} /> : <SpeakerIcon size={14} />}
    </button>
  );
}
