import { useRef, useState, useCallback } from 'react';
import { transcribeAudio } from '../lib/agent';

// Nagrywanie głosu (MediaRecorder) + transkrypcja przez xAI STT.
// onResult(text) dostaje rozpoznany tekst; reszta to stany do UI przycisku.
export function useVoiceTranscription(onResult) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const toggle = useCallback(async () => {
    setError(null);
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (!blob.size) return;
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text) onResult(text);
        } catch (err) {
          setError(err.message || 'Nie udało się przetworzyć nagrania.');
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError('Brak dostępu do mikrofonu.');
    }
  }, [recording, onResult]);

  return { recording, transcribing, error, toggle };
}
