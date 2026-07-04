import { supabase } from './supabase';

// Zarządzanie osobistymi tokenami API (funkcja Edge `tokens`, pod JWT użytkownika).
// Plaintext tokenu przychodzi TYLKO z createToken() — trzeba go od razu skopiować.

async function readErr(error) {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      if (body?.error) return body.error;
    }
  } catch { /* ignore */ }
  return error?.message ?? 'Błąd operacji na tokenach';
}

export async function listTokens() {
  const { data, error } = await supabase.functions.invoke('tokens', { method: 'GET' });
  if (error) throw new Error(await readErr(error));
  return data?.tokens ?? [];
}

export async function createToken(name) {
  const { data, error } = await supabase.functions.invoke('tokens', {
    method: 'POST',
    body: { name: name ?? null },
  });
  if (error) throw new Error(await readErr(error));
  return data; // { token, id, name, token_prefix, created_at }
}

export async function revokeToken(id) {
  const { error } = await supabase.functions.invoke('tokens', {
    method: 'DELETE',
    body: { id },
  });
  if (error) throw new Error(await readErr(error));
}

// Bazowy URL endpointów API (do pokazania w UI / dokumentacji).
export const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;
