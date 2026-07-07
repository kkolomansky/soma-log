import { useState } from 'react';
import { LogoFull } from '../components/Logo';
import { GoogleIcon } from '../components/icons';
import { sendPasswordReset } from '../lib/account';

/**
 * Ekran logowania / rejestracji (e-mail + hasło + Google OAuth) oraz reset hasła.
 * Po rejestracji z włączonym potwierdzaniem e-maila pokazujemy komunikat,
 * żeby użytkownik kliknął link aktywacyjny ze skrzynki.
 */
export default function Auth({ onSignIn, onSignUp, onSignInWithGoogle }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';
  const isReset = mode === 'reset';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (isReset) {
      try {
        await sendPasswordReset(email.trim());
        setInfo('Jeśli konto istnieje, wysłaliśmy link do zmiany hasła. Sprawdź skrzynkę.');
      } catch (err) {
        setError(err.message || 'Nie udało się wysłać wiadomości.');
      }
    } else if (isSignup) {
      const { error: err, needsConfirmation } = await onSignUp(email.trim(), password);
      if (err) {
        setError(err);
      } else if (needsConfirmation) {
        setInfo('Konto utworzone. Sprawdź skrzynkę i potwierdź adres e-mail, aby się zalogować.');
        setPassword('');
      }
    } else {
      const err = await onSignIn(email.trim(), password);
      if (err) setError(err);
    }

    setBusy(false);
  };

  const goMode = (next) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };
  const switchMode = () => goMode(isSignup ? 'signin' : 'signup');

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    // Sukces = przekierowanie do Google; błąd (np. wyłączony provider) pokazujemy tutaj.
    const err = onSignInWithGoogle ? await onSignInWithGoogle() : 'Logowanie Google niedostępne.';
    if (err) { setError(err); setBusy(false); }
  };

  return (
    <div className="px-4 pt-14 pb-4">
      <div className="mb-5 flex flex-col items-center text-center">
        <LogoFull size={44} withTagline centered className="mb-12" />
        <h1 className="text-xl font-display font-bold text-txt tracking-tight">
          {isReset ? 'Reset hasła' : isSignup ? 'Załóż konto' : 'Zaloguj się'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-txt-3 text-xs font-medium">E-MAIL</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ty@przyklad.pl"
            autoComplete="email"
            className="bg-bg text-txt placeholder-txt-3 text-sm rounded-xl px-3 py-3 outline-none border border-transparent focus:border-border-strong"
          />
        </label>

        {!isReset && (
          <label className="flex flex-col gap-1">
            <span className="text-txt-3 text-xs font-medium">HASŁO</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="bg-bg text-txt placeholder-txt-3 text-sm rounded-xl px-3 py-3 outline-none border border-transparent focus:border-border-strong"
            />
            {!isSignup && (
              <button type="button" onClick={() => goMode('reset')}
                className="self-end text-txt-3 text-[11px] mt-1 hover:text-txt-2 transition-colors">
                Nie pamiętasz hasła?
              </button>
            )}
          </label>
        )}

        {isReset && (
          <p className="text-txt-3 text-[11px] leading-relaxed">
            Podaj adres e-mail konta — wyślemy link do ustawienia nowego hasła.
          </p>
        )}

        {error ? (
          <p className="text-danger text-xs leading-relaxed">{error}</p>
        ) : null}
        {info ? (
          <p className="text-recovery text-xs leading-relaxed">{info}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-2xl font-semibold text-base bg-recovery text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? '...' : isReset ? 'Wyślij link' : isSignup ? 'Załóż konto' : 'Zaloguj się'}
        </button>

        {/* Separator + logowanie przez Google (poza trybem resetu hasła) */}
        {!isReset && (
          <>
            <div className="flex items-center gap-3 text-txt-3 text-[11px] uppercase tracking-wide">
              <span className="flex-1 h-px bg-border" />
              lub
              <span className="flex-1 h-px bg-border" />
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-white text-[#1F1F1F] flex items-center justify-center gap-2.5 hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              <GoogleIcon size={18} />
              Kontynuuj z Google
            </button>
          </>
        )}
      </form>

      <button
        onClick={isReset ? () => goMode('signin') : switchMode}
        className="w-full text-center text-txt-3 text-sm mt-5 hover:text-txt-2 transition-colors"
      >
        {isReset ? 'Wróć do logowania' : isSignup ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Załóż je'}
      </button>
    </div>
  );
}
