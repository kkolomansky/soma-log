import { useState } from 'react';

/**
 * Ekran logowania / rejestracji (e-mail + hasło).
 * Po rejestracji z włączonym potwierdzaniem e-maila pokazujemy komunikat,
 * żeby użytkownik kliknął link aktywacyjny ze skrzynki.
 */
export default function Auth({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (isSignup) {
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

  const switchMode = () => {
    setMode(isSignup ? 'signin' : 'signup');
    setError(null);
    setInfo(null);
  };

  return (
    <div className="px-4 pt-16 pb-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {isSignup ? 'Załóż konto' : 'Zaloguj się'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isSignup
            ? 'Utwórz konto, aby zapisywać swoje wpisy'
            : 'Twoje wpisy są widoczne tylko dla Ciebie'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1c1c1e] rounded-2xl p-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-gray-500 text-xs font-medium">E-MAIL</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ty@przyklad.pl"
            autoComplete="email"
            className="bg-[#111111] text-white placeholder-gray-700 text-sm rounded-xl px-3 py-3 outline-none border border-transparent focus:border-[#3a3a3a]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-gray-500 text-xs font-medium">HASŁO</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className="bg-[#111111] text-white placeholder-gray-700 text-sm rounded-xl px-3 py-3 outline-none border border-transparent focus:border-[#3a3a3a]"
          />
        </label>

        {error ? (
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        ) : null}
        {info ? (
          <p className="text-green-400 text-xs leading-relaxed">{info}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-2xl font-semibold text-base bg-white text-black transition-opacity disabled:opacity-50"
        >
          {busy ? '...' : isSignup ? 'Załóż konto' : 'Zaloguj się'}
        </button>
      </form>

      <button
        onClick={switchMode}
        className="w-full text-center text-gray-500 text-sm mt-5 hover:text-gray-300 transition-colors"
      >
        {isSignup ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Załóż je'}
      </button>
    </div>
  );
}
