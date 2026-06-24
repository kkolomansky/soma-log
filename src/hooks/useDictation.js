import { useRef, useState, useCallback, useEffect } from 'react';
import { transcribeAudio } from '../lib/agent';

const SpeechRecognition =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

// Dyktowanie „push-to-talk": start() na wciśnięcie, stop() na puszczenie.
// Web Speech API → transkrypcja NA ŻYWO (słowo po słowie). Brak wsparcia (np. Safari/iOS)
// → fallback: nagranie MediaRecorder na czas trzymania + xAI STT po puszczeniu.
//
// Kontrakt: useDictation({ getText, onText }) gdzie onText(joinedText, isFinal).
// `joinedText` = baza (tekst pola w chwili start) + rozpoznana sesja.
export function useDictation({ getText, onText }) {
  const supported = !!SpeechRecognition;
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const recogRef = useRef(null);
  const baseRef = useRef('');
  const finalRef = useRef('');
  // Fallback (MediaRecorder)
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const join = useCallback((sessionText) => {
    const base = baseRef.current;
    const s = (sessionText || '').trim();
    if (!s) return base;
    return base ? `${base} ${s}` : s;
  }, []);

  // ── Web Speech API ──
  const startLive = useCallback(() => {
    const recog = new SpeechRecognition();
    recog.lang = 'pl-PL';
    recog.continuous = true;
    recog.interimResults = true;
    finalRef.current = '';
    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalRef.current += res[0].transcript;
        else interim += res[0].transcript;
      }
      onText(join(finalRef.current + interim), false);
    };
    recog.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError('Błąd rozpoznawania mowy.');
      }
    };
    recog.onend = () => {
      setListening(false);
      onText(join(finalRef.current), true);
    };
    recogRef.current = recog;
    recog.start();
    setListening(true);
  }, [join, onText]);

  // ── Fallback: nagrywanie + batch STT ──
  const startRecord = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setListening(false);
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      if (!blob.size) return;
      setTranscribing(true);
      try {
        const text = await transcribeAudio(blob);
        if (text) onText(join(text), true);
      } catch (err) {
        setError(err.message || 'Nie udało się przetworzyć nagrania.');
      } finally {
        setTranscribing(false);
      }
    };
    recorderRef.current = rec;
    rec.start();
    setListening(true);
  }, [join, onText]);

  const start = useCallback(async () => {
    if (listening || transcribing) return;
    setError(null);
    baseRef.current = (getText?.() ?? '').trim();
    try {
      if (supported) startLive();
      else await startRecord();
    } catch {
      setError('Brak dostępu do mikrofonu.');
      setListening(false);
    }
  }, [listening, transcribing, getText, supported, startLive, startRecord]);

  const stop = useCallback(() => {
    if (supported) recogRef.current?.stop();
    else recorderRef.current?.stop();
  }, [supported]);

  // Sprzątanie przy odmontowaniu.
  useEffect(() => () => {
    try { recogRef.current?.abort(); } catch { /* ignore */ }
    try { recorderRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  return { supported, listening, transcribing, error, start, stop };
}
