import { supabase } from './supabase';

// Prywatny bucket na zdjęcia dnia (RLS: '<user_id>/<uuid>.<ext>', właściciel = pierwszy segment).
export const PHOTO_BUCKET = 'soma-photos';

function extFromFile(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  // Fallback z typu MIME (np. gdy plik bez rozszerzenia).
  const fromType = file.type?.split('/').pop()?.toLowerCase();
  return fromType && /^[a-z0-9]{1,5}$/.test(fromType) ? fromType : 'jpg';
}

// Wgraj plik do Storage pod ścieżkę '<userId>/<uuid>.<ext>'. Zwraca ścieżkę (do zapisu w wierszu).
export async function uploadPhoto(userId, file) {
  const path = `${userId}/${crypto.randomUUID()}.${extFromFile(file)}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  return path;
}

// Usuń pliki po ścieżkach. Pusta lista → no-op.
export async function removePhotos(paths) {
  if (!paths || paths.length === 0) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

// Batch signed URLs do podglądu prywatnych plików. Zwraca [{ path, url }] (url=null gdy błąd).
export async function signedUrls(paths, expiresIn = 3600) {
  if (!paths || paths.length === 0) return [];
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, expiresIn);
  if (error) throw new Error(error.message);
  return data.map((d) => ({ path: d.path, url: d.signedUrl ?? null }));
}
