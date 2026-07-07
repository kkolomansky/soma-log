import { useState, useEffect, useCallback } from 'react';
import SpeakButton from './SpeakButton';
import ConfirmModal from './ConfirmModal';
import { UserIcon, SpeakerIcon, KeyIcon, GaugeIcon, MailIcon, LockIcon, TextSizeIcon, TrashIcon, LogoutIcon } from './icons';
import { VOICES, SAMPLE_TEXT, getVoice, setVoice, saveVoiceToServer } from '../lib/voice';
import { listTokens, createToken, revokeToken, API_BASE } from '../lib/apiTokens';
import { getUsageToday, LOGAN_DAILY_LIMIT } from '../lib/usage';
import { FONT_SCALES, getFontScale, setFontScale } from '../lib/fontScale';
import { displayName, updateUsername, updateEmail, changePassword, deleteAccount } from '../lib/account';

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

// Pojedyncze pole edycji z przyciskiem zapisu i komunikatem o wyniku.
function EditField({ label, type = 'text', initial = '', placeholder, autoComplete, saveLabel = 'Zapisz', hint, onSave, validate }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: bool, text }
  useEffect(() => { setValue(initial); }, [initial]);

  const submit = async () => {
    if (busy) return;
    const err = validate ? validate(value) : null;
    if (err) { setMsg({ ok: false, text: err }); return; }
    setBusy(true); setMsg(null);
    try { await onSave(value); setMsg({ ok: true, text: 'Zapisano.' }); }
    catch (e) { setMsg({ ok: false, text: e.message || 'Nie udało się zapisać.' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="mb-3">
      <label className="block text-txt-3 text-[11px] font-medium mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={e => { setValue(e.target.value); setMsg(null); }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-txt text-sm outline-none focus:border-recovery/60 transition-colors"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="shrink-0 rounded-xl bg-recovery/90 hover:bg-recovery text-bg text-xs font-medium px-3 py-2 transition-colors disabled:opacity-50"
        >
          {busy ? '…' : saveLabel}
        </button>
      </div>
      {hint && !msg && <p className="text-txt-3 text-[10px] leading-snug mt-1">{hint}</p>}
      {msg && <p className={`text-[10px] leading-snug mt-1 ${msg.ok ? 'text-recovery' : 'text-danger'}`}>{msg.text}</p>}
    </div>
  );
}

// Zmiana hasła: obecne + nowe + powtórzenie nowego (z weryfikacją obecnego hasła).
function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const submit = async () => {
    if (busy) return;
    if (next.length < 6) { setMsg({ ok: false, text: 'Nowe hasło musi mieć co najmniej 6 znaków.' }); return; }
    if (next !== repeat) { setMsg({ ok: false, text: 'Nowe hasła nie są takie same.' }); return; }
    setBusy(true); setMsg(null);
    try {
      await changePassword(current, next);
      setMsg({ ok: true, text: 'Hasło zmienione.' });
      setCurrent(''); setNext(''); setRepeat('');
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Nie udało się zmienić hasła.' });
    } finally { setBusy(false); }
  };

  const field = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-txt text-sm outline-none focus:border-recovery/60 transition-colors';

  return (
    <div className="mb-3">
      <label className="block text-txt-3 text-[11px] font-medium mb-1">Zmiana hasła</label>
      <div className="flex flex-col gap-2">
        <input type="password" value={current} autoComplete="current-password" placeholder="Obecne hasło"
          onChange={e => { setCurrent(e.target.value); setMsg(null); }} className={field} />
        <input type="password" value={next} autoComplete="new-password" placeholder="Nowe hasło"
          onChange={e => { setNext(e.target.value); setMsg(null); }} className={field} />
        <input type="password" value={repeat} autoComplete="new-password" placeholder="Powtórz nowe hasło"
          onChange={e => { setRepeat(e.target.value); setMsg(null); }} className={field} />
        <button onClick={submit} disabled={busy}
          className="self-end rounded-xl bg-recovery/90 hover:bg-recovery text-bg text-xs font-medium px-3 py-2 transition-colors disabled:opacity-50">
          {busy ? '…' : 'Zmień hasło'}
        </button>
      </div>
      {msg && <p className={`text-[10px] leading-snug mt-1 ${msg.ok ? 'text-recovery' : 'text-danger'}`}>{msg.text}</p>}
    </div>
  );
}

// Widok „Konto": nazwa użytkownika, e-mail, hasło, wylogowanie + usunięcie konta.
function AccountPanel({ user, onSignOut }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const runDelete = async () => {
    setDeleting(true); setDeleteError(null);
    try { await deleteAccount(); /* wylogowanie → App pokaże ekran logowania */ }
    catch (e) { setDeleteError(e.message); setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <>
      <EditField
        label="Nazwa użytkownika"
        initial={user?.user_metadata?.username || ''}
        placeholder="np. Karol"
        onSave={updateUsername}
        validate={v => (v.trim().length < 2 ? 'Podaj co najmniej 2 znaki.' : null)}
      />
      <EditField
        label="Adres e-mail"
        type="email"
        initial={user?.email || ''}
        placeholder="ty@example.com"
        autoComplete="email"
        hint="Na nowy adres wyślemy link potwierdzający zmianę."
        onSave={updateEmail}
        validate={v => (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Nieprawidłowy adres e-mail.')}
      />
      <ChangePasswordForm />

      <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border text-txt-2 text-sm font-medium py-2.5 hover:bg-surface hover:text-txt transition-colors"
        >
          <LogoutIcon size={16} /> Wyloguj się
        </button>
        <button
          onClick={() => { setDeleteError(null); setConfirmDelete(true); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-danger/40 text-danger text-sm font-medium py-2.5 hover:bg-danger/10 transition-colors"
        >
          <TrashIcon size={16} /> Usuń konto
        </button>
        <p className="text-txt-3 text-[10px] leading-snug">
          Usunięcie trwale kasuje konto i wszystkie Twoje dane (wpisy, rozmowy, zdjęcia). Tej operacji nie można cofnąć.
        </p>
        {deleteError && <p className="text-danger text-[11px]">{deleteError}</p>}
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Wylogować się?"
        message="Czy na pewno chcesz się wylogować?"
        confirmLabel="Wyloguj"
        cancelLabel="Anuluj"
        tone="primary"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); onSignOut?.(); }}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Usunąć konto?"
        message="Czy na pewno chcesz usunąć to konto? Wszystkie Twoje dane zostaną trwale usunięte. Tej operacji nie można cofnąć."
        confirmLabel="Usuń konto"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={runDelete}
      />
    </>
  );
}

// Widok „Wielkość czcionki" — skala interfejsu (zoom), poprawia czytelność na mobile.
function AppearancePanel() {
  const [scale, setScale] = useState(getFontScale());
  const choose = (id) => { setFontScale(id); setScale(id); };

  return (
    <>
      <p className="text-txt-3 text-[11px] leading-relaxed mb-3">
        Zwiększ wielkość tekstu i elementów, jeśli w widoku mobilnym są zbyt drobne. Ustawienie zapamiętujemy na tym urządzeniu.
      </p>
      <div className="flex flex-col gap-1.5">
        {FONT_SCALES.map(s => {
          const active = scale === s.id;
          return (
            <button
              key={s.id}
              onClick={() => choose(s.id)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? 'border-recovery/50 bg-recovery/10' : 'border-border bg-surface hover:bg-elevated'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                active ? 'bg-recovery border-recovery text-bg' : 'border-border-strong text-transparent'
              }`}>
                <CheckIcon size={13} />
              </span>
              <span className="text-txt font-medium leading-tight" style={{ fontSize: `${13 * s.value}px` }}>{s.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// Nagłówek grupy pozycji menu.
function GroupLabel({ children }) {
  return <p className="text-txt-3 text-[10px] font-semibold uppercase tracking-wide px-1 mt-3 mb-1.5 first:mt-0">{children}</p>;
}

function MenuItem({ label, desc, Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left hover:bg-elevated transition-colors"
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
  );
}

// Menu ustawień — pogrupowane logicznie: Konto → Wygląd → Logan → Deweloper.
function SettingsMenu({ go }) {
  return (
    <div className="flex flex-col gap-1.5">
      <GroupLabel>Konto</GroupLabel>
      <MenuItem label="Konto" desc="Nazwa, e-mail, hasło, usunięcie konta" Icon={UserIcon} onClick={() => go('account')} />

      <GroupLabel>Wygląd</GroupLabel>
      <MenuItem label="Wielkość czcionki" desc="Powiększ tekst dla lepszej czytelności" Icon={TextSizeIcon} onClick={() => go('appearance')} />

      <GroupLabel>Logan</GroupLabel>
      <MenuItem label="Głos Logana" desc="Wybór lektora odczytu analizy" Icon={SpeakerIcon} onClick={() => go('voice')} />
      <MenuItem label="Limity zapytań" desc="Dzienne zużycie limitu Logana" Icon={GaugeIcon} onClick={() => go('usage')} />

      <GroupLabel>Deweloper</GroupLabel>
      <MenuItem label="Tokeny API" desc="Sterowanie aplikacją spoza SomaLog" Icon={KeyIcon} onClick={() => go('tokens')} />
    </div>
  );
}

const TITLES = {
  menu: 'Panel użytkownika',
  account: 'Konto',
  appearance: 'Wielkość czcionki',
  voice: 'Głos Logana',
  tokens: 'Tokeny API',
  usage: 'Limity zapytań',
};

// Panel użytkownika — menu ustawień z podwidokami.
export default function SettingsPanel({ open, onClose, initialView = 'menu', user, onSignOut }) {
  const [view, setView] = useState('menu');
  // Przy otwarciu ustaw widok startowy (np. 'usage' po wyczerpaniu limitu Logana).
  useEffect(() => { if (open) setView(initialView); }, [open, initialView]);

  const inSub = view !== 'menu';
  const username = displayName(user);
  const title = TITLES[view] ?? 'Panel użytkownika';

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
              <span className="flex flex-col leading-tight">
                <span>{title}</span>
                {!inSub && username && (
                  <span className="text-txt-3 text-xs font-normal">Zalogowano jako {username}</span>
                )}
              </span>
            </p>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="w-8 h-8 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {view === 'account' ? <AccountPanel user={user} onSignOut={onSignOut} />
            : view === 'appearance' ? <AppearancePanel />
            : view === 'voice' ? <VoicePicker />
            : view === 'tokens' ? <TokensPanel />
            : view === 'usage' ? <UsagePanel />
            : <SettingsMenu go={setView} />}
        </div>
      </div>
    </>
  );
}
