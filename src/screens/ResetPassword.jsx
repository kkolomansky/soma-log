import { useState } from 'react';
import { LogoFull } from '../components/Logo';
import { updatePassword } from '../lib/account';

/**
 * Ekran ustawienia nowego hasła po kliknięciu w link resetujący z e-maila.
 * Wchodzimy tu, gdy Supabase zgłosi sesję odzyskiwania (PASSWORD_RECOVERY).
 * Po zapisaniu hasła wychodzimy z trybu odzyskiwania → normalna aplikacja.
 */
export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Hasło musi mieć co najmniej 6 znaków.'); return; }
    if (password !== repeat) { setError('Hasła nie są takie same.'); return; }
    setBusy(true);
    try {
      await updatePassword(password);
      onDone?.(); // sesja jest już ważna → wracamy do aplikacji
    } catch (err) {
      setError(err.message || 'Nie udało się ustawić hasła.');
      setBusy(false);
    }
  };

  const inputClass = 'bg-bg text-txt placeholder-txt-3 text-sm rounded-xl px-3 py-3 outline-none border border-transparent focus:border-border-strong';

  return (
    <div className="px-4 pt-14 pb-4">
      <div className="mb-5 flex flex-col items-center text-center">
        <LogoFull size={44} withTagline centered className="mb-12" />
        <h1 className="text-xl font-display font-bold text-txt tracking-tight">Ustaw nowe hasło</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-txt-3 text-xs font-medium">NOWE HASŁO</span>
          <input type="password" required minLength={6} value={password} autoComplete="new-password"
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-txt-3 text-xs font-medium">POWTÓRZ NOWE HASŁO</span>
          <input type="password" required minLength={6} value={repeat} autoComplete="new-password"
            onChange={e => setRepeat(e.target.value)} placeholder="••••••••" className={inputClass} />
        </label>

        {error && <p className="text-danger text-xs leading-relaxed">{error}</p>}

        <button type="submit" disabled={busy}
          className="w-full py-3.5 rounded-2xl font-semibold text-base bg-recovery text-bg hover:opacity-90 transition-opacity disabled:opacity-50">
          {busy ? '...' : 'Zapisz nowe hasło'}
        </button>
      </form>
    </div>
  );
}
