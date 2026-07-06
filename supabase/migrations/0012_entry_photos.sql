-- Opcjonalne zdjęcia per dzień. Referencje trzymamy jako tablicę ścieżek w kolumnie
-- soma_entries.photos (jsonb), a same pliki w prywatnym buckecie Storage 'soma-photos'.
-- Trigger auto-embeddingu (0009) nasłuchuje tylko kolumn treści (note + 6 metryk), więc
-- dodanie photos NIE wywoła zbędnego przeliczania embeddingów. Wszystko idempotentne —
-- musi przejść też na preview branch Supabase (odtworzenie bazy od zera z plików repo).

-- ── Kolumna z referencjami zdjęć (tablica ścieżek Storage) ──
alter table public.soma_entries
  add column if not exists photos jsonb not null default '[]'::jsonb;

-- ── Prywatny bucket na zdjęcia dnia ──
-- Limit 10 MB/plik, tylko obrazy. Prywatny → podgląd wyłącznie przez signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'soma-photos',
  'soma-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do nothing;

-- ── RLS na storage.objects: izolacja per-user ──
-- Ścieżka pliku to '<user_id>/<uuid>.<ext>', więc pierwszy segment = właściciel.
-- Wzorzec jak dla soma_entries (0001): użytkownik widzi/zmienia TYLKO swoje pliki.
drop policy if exists "soma photos read own" on storage.objects;
create policy "soma photos read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'soma-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "soma photos insert own" on storage.objects;
create policy "soma photos insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'soma-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "soma photos update own" on storage.objects;
create policy "soma photos update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'soma-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'soma-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "soma photos delete own" on storage.objects;
create policy "soma photos delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'soma-photos' and (storage.foldername(name))[1] = auth.uid()::text);
