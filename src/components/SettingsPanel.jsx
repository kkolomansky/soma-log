import { useState, useEffect, useCallback } from 'react';
import SpeakButton from './SpeakButton';
import { UserIcon, SpeakerIcon, KeyIcon, GaugeIcon } from './icons';
import { VOICES, SAMPLE_TEXT, getVoice, setVoice, saveVoiceToServer } from '../lib/voice';
import { listTokens, createToken, revokeToken, API_BASE } from '../lib/apiTokens';
import { getUsageToday, LOGAN_DAILY_LIMIT } from '../lib/usage';

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

function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('pl-PL'); } catch { return '—'; }
}

// Zarządzanie osobistymi tokenami API. Plaintext pokazywany raz — z przyciskiem „Kopiuj".
function TokensPanel() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fresh, setFresh] = useState(null); // świeżo utworzony token (plaintext)
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTokens(await listTokens()); setError(null); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (busy) return;
    setBusy(true); setError(null); setFresh(null); setCopied(false);
    try {
      const created = await createToken(null);
      setFresh(created.token);
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(fresh); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* brak uprawnień do schowka */ }
  };

  const revoke = async (id) => {
    setBusy(true); setError(null);
    try { await revokeToken(id); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <p className="text-txt-3 text-[11px] leading-relaxed mb-3">
        Tokeny pozwalają sterować SomaLog spoza aplikacji (skrypty, automatyzacje). Wysyłaj je w nagłówku
        <span className="text-txt-2"> Authorization: Bearer &lt;token&gt;</span> na <span className="text-txt-2 break-all">{API_BASE}</span>.
      </p>

      <button
        onClick={generate}
        disabled={busy}
        className="w-full mb-3 rounded-xl bg-recovery/90 hover:bg-recovery text-bg text-sm font-medium py-2.5 transition-colors disabled:opacity-50"
      >
        {busy ? 'Pracuję…' : 'Generuj nowy token'}
      </button>

      {fresh && (
        <div className="mb-3 rounded-xl border border-recovery/50 bg-recovery/10 p-3">
          <p className="text-txt-2 text-[11px] leading-relaxed mb-2">
            Skopiuj token teraz — <span className="text-txt font-medium">nie zobaczysz go ponownie</span>.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 text-txt text-[11px] bg-surface rounded-lg px-2 py-1.5 break-all">{fresh}</code>
            <button onClick={copy} className="shrink-0 rounded-lg border border-border-strong px-2.5 py-1.5 text-xs text-txt-2 hover:text-txt hover:bg-surface transition-colors">
              {copied ? 'Skopiowano' : 'Kopiuj'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-danger text-[11px] mb-2">{error}</p>}

      {loading ? (
        <p className="text-txt-3 text-[11px]">Ładowanie…</p>
      ) : tokens.length === 0 ? (
        <p className="text-txt-3 text-[11px]">Brak tokenów. Wygeneruj pierwszy powyżej.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-txt text-[13px] font-medium leading-tight truncate">{t.token_prefix}…</span>
                <span className="block text-txt-3 text-[11px] leading-tight truncate">
                  utworzono {fmtDate(t.created_at)}{t.last_used_at ? ` · użyto ${fmtDate(t.last_used_at)}` : ' · nieużywany'}
                </span>
              </span>
              <button
                onClick={() => revoke(t.id)}
                disabled={busy}
                className="shrink-0 rounded-lg border border-border-strong px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
              >
                Odwołaj
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Aktualny offset GMT strefy Europe/Warsaw (np. "GMT+2" latem, "GMT+1" zimą).
function warsawGmt() {
  try {
    const parts = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', timeZoneName: 'shortOffset' })
      .formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+2';
  } catch { return 'GMT+2'; }
}

// Godzina resetu limitu (północ Europe/Warsaw) w czytelnej formie.
function fmtResetTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

// Podgląd dziennego limitu zapytań do Logana (wspólny dla czatu, /ask i MCP). Tylko do odczytu.
function UsagePanel() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsage(await getUsageToday()); setError(null); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const count = usage?.count ?? 0;
  const remaining = Math.max(0, LOGAN_DAILY_LIMIT - count);
  const pct = LOGAN_DAILY_LIMIT > 0 ? Math.min(100, Math.round((count / LOGAN_DAILY_LIMIT) * 100)) : 0;
  const atLimit = count >= LOGAN_DAILY_LIMIT;

  return (
    <>
      <p className="text-txt-3 text-[11px] leading-relaxed mb-3">
        Zapytania do Logana (czat, analiza, endpoint <span className="text-txt-2">/ask</span> i narzędzie MCP)
        są objęte wspólnym dziennym limitem per konto. Licznik zeruje się o północy (Europe/Warsaw, {warsawGmt()}).
      </p>

      {loading ? (
        <p className="text-txt-3 text-[11px]">Ładowanie…</p>
      ) : error ? (
        <p className="text-danger text-[11px]">{error}</p>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-txt text-2xl font-display font-semibold tabular-nums">
              {count}<span className="text-txt-3 text-base font-normal"> / {LOGAN_DAILY_LIMIT}</span>
            </span>
            <span className={`text-[11px] font-medium ${atLimit ? 'text-danger' : 'text-txt-3'}`}>
              {atLimit ? 'limit wyczerpany' : `pozostało ${remaining}`}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-elevated overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? 'bg-danger' : 'bg-recovery'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-txt-3 text-[11px] leading-relaxed mt-3">
            Reset: <span className="text-txt-2">{fmtResetTime(usage?.resetAt)}</span>
          </p>
        </div>
      )}
    </>
  );
}

// Lista pozycji menu panelu.
function SettingsMenu({ onOpenVoice, onOpenTokens, onOpenUsage }) {
  const items = [
    { id: 'voice', label: 'Głos Logana', desc: 'Wybór lektora odczytu analizy', Icon: SpeakerIcon, onClick: onOpenVoice },
    { id: 'tokens', label: 'Tokeny API', desc: 'Sterowanie aplikacją spoza SomaLog', Icon: KeyIcon, onClick: onOpenTokens },
    { id: 'usage', label: 'Limity zapytań', desc: 'Dzienne zużycie limitu Logana', Icon: GaugeIcon, onClick: onOpenUsage },
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
  const [view, setView] = useState('menu'); // 'menu' | 'voice' | 'tokens' | 'usage'
  useEffect(() => { if (open) setView('menu'); }, [open]);

  const inVoice = view === 'voice';
  const inTokens = view === 'tokens';
  const inUsage = view === 'usage';
  const inSub = inVoice || inTokens || inUsage;
  const title = inVoice ? 'Głos Logana' : inTokens ? 'Tokeny API' : inUsage ? 'Limity zapytań' : 'Panel użytkownika';

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
              {inSub ? (
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
              {title}
            </p>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="w-8 h-8 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {inVoice ? <VoicePicker />
            : inTokens ? <TokensPanel />
            : inUsage ? <UsagePanel />
            : <SettingsMenu onOpenVoice={() => setView('voice')} onOpenTokens={() => setView('tokens')} onOpenUsage={() => setView('usage')} />}
        </div>
      </div>
    </>
  );
}
