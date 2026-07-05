import { supabase } from './supabase';

// Dzienny limit zapytań do Logana (per użytkownik). Musi odpowiadać zmiennej środowiskowej
// LOGAN_DAILY_LIMIT funkcji Edge (domyślnie 100) — to wartość tylko do wyświetlenia; limit
// egzekwuje serwer. Nadpisywalny przez VITE_LOGAN_DAILY_LIMIT w .env.local.
export const LOGAN_DAILY_LIMIT = Number(import.meta.env.VITE_LOGAN_DAILY_LIMIT ?? 100);

// Zwraca bieżące dzienne zużycie limitu Logana (bez zwiększania licznika).
// { count, resetAt } — count: liczba zapytań dziś, resetAt: ISO północy (Europe/Warsaw).
export async function getUsageToday() {
  const { data, error } = await supabase.rpc('soma_ai_usage_today');
  if (error) throw new Error(error.message ?? 'Nie udało się pobrać zużycia limitu');
  return { count: data?.count ?? 0, resetAt: data?.reset_at ?? null };
}
