import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Stan uwierzytelnienia oparty o Supabase Auth (e-mail + hasło).
 * Udostępnia bieżącą sesję oraz akcje logowania, rejestracji i wylogowania.
 * Wpisy są izolowane per użytkownik przez RLS w tabeli `soma_entries`.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tryb odzyskiwania hasła — po wejściu z linku resetującego (event PASSWORD_RECOVERY)
  // pokazujemy ekran ustawienia nowego hasła zamiast normalnej aplikacji.
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const clearRecovery = useCallback(() => setRecovery(false), []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, needsConfirmation: false };
    // Gdy potwierdzanie e-maila jest włączone, signUp nie tworzy aktywnej sesji.
    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Logowanie przez Google (OAuth). Po powrocie z Google Supabase sam ustawi sesję
  // (detectSessionInUrl = domyślnie true) i odpali onAuthStateChange.
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return error?.message ?? null;
  }, []);

  return { session, loading, recovery, clearRecovery, signIn, signUp, signOut, signInWithGoogle };
}
