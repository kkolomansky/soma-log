import { supabase } from './supabase';

// Zarządzanie kontem użytkownika (Supabase Auth). Zmiany e-maila/hasła/nazwy idą przez
// klienta pod JWT użytkownika; usunięcie konta wymaga uprawnień admina → funkcja brzegowa.

// Nazwa użytkownika: z user_metadata.username, w razie braku — część e-maila przed „@".
export function displayName(user) {
  const name = user?.user_metadata?.username;
  if (name && String(name).trim()) return String(name).trim();
  return user?.email ? user.email.split('@')[0] : null;
}

export async function updateUsername(username) {
  const { error } = await supabase.auth.updateUser({ data: { username: username.trim() } });
  if (error) throw new Error(error.message);
}

export async function updateEmail(email) {
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

// Zmiana hasła z weryfikacją obecnego — Supabase nie sprawdza starego hasła przy updateUser,
// więc najpierw potwierdzamy je logowaniem (signInWithPassword na tym samym koncie).
export async function changePassword(currentPassword, newPassword) {
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) throw new Error('Brak adresu e-mail konta.');
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (signErr) throw new Error('Obecne hasło jest nieprawidłowe.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// Wysyłka linku do resetu hasła — po kliknięciu w mailu użytkownik wraca do aplikacji
// z sesją odzyskiwania (zdarzenie PASSWORD_RECOVERY) i ustawia nowe hasło.
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
}

// Usunięcie konta — funkcja brzegowa `delete-account` (service role) kasuje użytkownika,
// co kaskadowo usuwa jego dane. Po sukcesie wylogowujemy lokalną sesję.
export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Brak aktywnej sesji.');
  const { error } = await supabase.functions.invoke('delete-account', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message || 'Nie udało się usunąć konta.');
  await supabase.auth.signOut();
}
