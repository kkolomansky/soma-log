import { useState } from 'react';
import { createToken } from '../../lib/apiTokens';
import { navigate } from '../../lib/nav';
import { KeyIcon } from '../../components/icons';

// Generator osobistego tokenu API w górnym pasku docs (wspólny dla podstron API i MCP).
// Wymaga zalogowanej sesji (token tworzy funkcja `tokens` pod JWT). Bez sesji: link do logowania.
export default function TokenGenerator({ session }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!session) {
    return (
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-txt-2 hover:text-txt hover:bg-elevated transition-colors"
        title="Zaloguj się w aplikacji, aby wygenerować token"
      >
        <KeyIcon size={15} /> Zaloguj się po token
      </button>
    );
  }

  const generate = async () => {
    if (busy) return;
    setBusy(true); setError(null); setCopied(false);
    try {
      const created = await createToken(null);
      setToken(created.token);
      setOpen(true);
    } catch (e) { setError(e.message); setOpen(true); }
    finally { setBusy(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* brak dostępu do schowka */ }
  };

  return (
    <div className="relative">
      <button
        onClick={generate}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-recovery/90 hover:bg-recovery text-bg px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50"
      >
        <KeyIcon size={15} /> {busy ? 'Pracuję…' : 'Generuj token'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-elevated p-3 shadow-xl">
            {error ? (
              <p className="text-danger text-[12px]">{error}</p>
            ) : (
              <>
                <p className="text-txt-2 text-[11px] leading-relaxed mb-2">
                  Skopiuj token teraz — <span className="text-txt font-medium">nie zobaczysz go ponownie</span>.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 text-txt text-[11px] bg-surface rounded-lg px-2 py-1.5 break-all">{token}</code>
                  <button
                    onClick={copy}
                    className="shrink-0 rounded-lg border border-border-strong px-2.5 py-1.5 text-xs text-txt-2 hover:text-txt hover:bg-surface transition-colors"
                  >
                    {copied ? 'Skopiowano' : 'Kopiuj'}
                  </button>
                </div>
                <p className="mt-2 text-txt-3 text-[10.5px]">
                  Zarządzanie tokenami: w aplikacji, Panel użytkownika → Tokeny API.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
