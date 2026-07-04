import { useState, useEffect } from 'react';
import SpeakButton from './SpeakButton';
import { UserIcon, SpeakerIcon } from './icons';
import { VOICES, SAMPLE_TEXT, getVoice, setVoice, saveVoiceToServer } from '../lib/voice';

function CloseIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// Picker głosu Logana (xAI TTS) z odsłuchem próbek. Wybór trwały: cache + konto (Supabase).
function VoicePicker() {
  const [selected, setSelected] = useState(getVoice());
  const choose = (id) => { setVoice(id); setSelected(id); saveVoiceToServer(id); };

  return (
    <>
      <p className="text-txt-3 text-[11px] leading-relaxed mb-3">
        Odsłuchaj próbki (▶) i wybierz głos. Będzie używany za każdym razem przy odczycie analizy.
      </p>

      <div className="flex flex-col gap-1.5">
        {VOICES.map(v => {
          const active = selected === v.id;
          return (
            <div
              key={v.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                active ? 'border-recovery/50 bg-recovery/10' : 'border-border bg-surface'
              }`}
            >
              <button
                onClick={() => choose(v.id)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                  active ? 'bg-recovery border-recovery text-bg' : 'border-border-strong text-transparent'
                }`}>
                  <CheckIcon size={13} />
                </span>
                <span className="min-w-0">
                  <span className="block text-txt text-sm font-medium leading-tight">{v.label}</span>
                  <span className="block text-txt-3 text-[11px] leading-tight truncate">{v.desc}</span>
                </span>
              </button>
              <SpeakButton text={SAMPLE_TEXT} voiceId={v.id} />
            </div>
          );
        })}
      </div>
    </>
  );
}

// Lista pozycji menu panelu. Na razie jedna (głos Logana); gotowa na kolejne w przyszłości.
function SettingsMenu({ onOpenVoice }) {
  const items = [
    { id: 'voice', label: 'Głos Logana', desc: 'Wybór lektora odczytu analizy', Icon: SpeakerIcon, onClick: onOpenVoice },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {items.map(({ id, label, desc, Icon, onClick }) => (
        <button
          key={id}
          onClick={onClick}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left hover:bg-elevated transition-colors"
        >
          <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-elevated text-txt-2">
            <Icon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-txt text-sm font-medium leading-tight">{label}</span>
            <span className="block text-txt-3 text-[11px] leading-tight truncate">{desc}</span>
          </span>
          <span className="shrink-0 text-txt-3"><ChevronRightIcon size={16} /></span>
        </button>
      ))}
    </div>
  );
}

// Panel użytkownika — menu ustawień. Pozycje (na razie „Głos Logana") wchodzą w podwidoki.
export default function SettingsPanel({ open, onClose }) {
  const [view, setView] = useState('menu'); // 'menu' | 'voice'
  useEffect(() => { if (open) setView('menu'); }, [open]);

  const inVoice = view === 'voice';

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-[70] flex items-center justify-center px-6 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`w-full max-w-sm bg-elevated border border-border rounded-2xl p-5 transition-[transform,opacity] duration-200 ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="flex items-center gap-2 text-txt font-display font-semibold text-base">
              {inVoice ? (
                <button
                  onClick={() => setView('menu')}
                  aria-label="Wstecz"
                  className="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors"
                >
                  <ChevronLeftIcon />
                </button>
              ) : (
                <span className="text-txt-3"><UserIcon size={18} /></span>
              )}
              {inVoice ? 'Głos Logana' : 'Panel użytkownika'}
            </p>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="w-8 h-8 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {inVoice ? <VoicePicker /> : <SettingsMenu onOpenVoice={() => setView('voice')} />}
        </div>
      </div>
    </>
  );
}
