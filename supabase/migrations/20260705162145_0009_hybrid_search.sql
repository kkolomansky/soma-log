-- Wyszukiwanie hybrydowe dla agenta Logana: full-text (tsvector) nad notatkami + wektor (pgvector),
-- scalone z „ostatnimi N dniami" w jednym RPC. Plus auto-embedding nowych/edytowanych wpisów
-- (trigger pg_net → Edge Function embed-entry), żeby vector search obejmował świeże dane.

-- ── Full-text nad notatką (config 'simple' + unaccent = diakrytyko-niewrażliwie, po polsku) ──
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_net with schema extensions;

-- unaccent jest STABLE, więc nie może iść wprost do indeksu/CTE — owijamy w IMMUTABLE wrapper.
create or replace function public.f_unaccent(text)
  returns text
  language sql
  immutable
  parallel safe
  strict
  set search_path = extensions, public, pg_temp
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;

create index if not exists soma_entries_note_fts_idx
  on public.soma_entries
  using gin (to_tsvector('simple', public.f_unaccent(coalesce(note, ''))));

-- ── Hybrydowy RPC: (vector top N) ∪ (text top N) ∪ (ostatnie recent_days dni), dedup po wpisie ──
-- query_embedding może być NULL → część wektorowa pomijana (fail-open, gdy OpenAI nieosiągalne).
-- reference_date podaje edge (Europe/Warsaw), żeby „ostatnie 7 dni" nie zależało od strefy serwera.
-- BEZPIECZEŃSTWO: funkcja jest SECURITY DEFINER i wystawiona przez PostgREST, więc efektywny user to
-- coalesce(auth.uid(), filter_user_id): zalogowany użytkownik zawsze widzi TYLKO siebie (podany
-- filter_user_id jest ignorowany → brak IDOR), a service-role (auth.uid() = null; funkcja `api`)
-- podaje usera jawnie. Anon (auth.uid() null + domyślny filter_user_id = null) nie dostaje nic.
create or replace function public.hybrid_search_soma_entries(
  query_embedding extensions.vector(1536),
  query_text      text,
  match_count     int  default 30,
  recent_days     int  default 7,
  reference_date  date default current_date,
  filter_user_id  uuid default auth.uid()
)
returns table (
  entry_date        date,
  sleep             int,
  energy            int,
  motivation        int,
  fatigue           int,
  doms              int,
  stress            int,
  note              text,
  vector_similarity float,
  text_rank         float,
  is_recent         boolean
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  with vec as (
    select e.id, 1 - (e.embedding <=> query_embedding) as similarity
    from public.soma_entries e
    where e.user_id = coalesce(auth.uid(), filter_user_id)
      and query_embedding is not null
      and e.embedding is not null
    order by e.embedding <=> query_embedding
    limit match_count
  ),
  txt as (
    select
      e.id,
      ts_rank(
        to_tsvector('simple', public.f_unaccent(coalesce(e.note, ''))),
        websearch_to_tsquery('simple', public.f_unaccent(query_text))
      ) as rank
    from public.soma_entries e
    where e.user_id = coalesce(auth.uid(), filter_user_id)
      and query_text is not null
      and length(trim(query_text)) > 0
      and to_tsvector('simple', public.f_unaccent(coalesce(e.note, '')))
          @@ websearch_to_tsquery('simple', public.f_unaccent(query_text))
    order by rank desc
    limit match_count
  ),
  recent as (
    select e.id
    from public.soma_entries e
    where e.user_id = coalesce(auth.uid(), filter_user_id)
      and e.entry_date between (reference_date - (greatest(recent_days, 1) - 1)) and reference_date
  ),
  ids as (
    select id from vec
    union
    select id from txt
    union
    select id from recent
  )
  select
    e.entry_date,
    e.sleep, e.energy, e.motivation, e.fatigue, e.doms, e.stress,
    e.note,
    vec.similarity                as vector_similarity,
    txt.rank                      as text_rank,
    (recent.id is not null)       as is_recent
  from ids
  join public.soma_entries e on e.id = ids.id
  left join vec    on vec.id    = ids.id
  left join txt    on txt.id    = ids.id
  left join recent on recent.id = ids.id
  order by (recent.id is not null) desc,
           coalesce(vec.similarity, 0) desc,
           coalesce(txt.rank, 0) desc,
           e.entry_date desc;
$$;

grant execute on function public.hybrid_search_soma_entries(
  extensions.vector(1536), text, int, int, date, uuid
) to authenticated, service_role;

-- ── Auto-embedding: trigger woła Edge Function embed-entry przez pg_net ──
-- URL funkcji i sekret nagłówka trzymamy w Vault (nie w gicie):
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/embed-entry', 'embed_entry_url');
--   select vault.create_secret('<losowy-sekret>', 'embed_webhook_secret');
-- embed-entry aktualizuje TYLKO kolumnę embedding, a trigger nasłuchuje wyłącznie kolumn treści
-- (note + 6 metryk) — dzięki temu przeliczenie embeddingu NIE odpala triggera ponownie (brak pętli).
create or replace function public.trigger_embed_entry()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, extensions, vault
as $$
declare
  fn_url text;
  secret text;
begin
  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'embed_entry_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'embed_webhook_secret';
  if fn_url is null then
    return NEW; -- brak konfiguracji Vault → nie blokujemy zapisu wpisu
  end if;
  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-embed-secret', coalesce(secret, '')),
    body    := jsonb_build_object('id', NEW.id)
  );
  return NEW;
end;
$$;

-- Funkcja triggera nie powinna być wołalna jako RPC — odbieramy EXECUTE od ról API.
revoke execute on function public.trigger_embed_entry() from public, anon, authenticated;

drop trigger if exists soma_entries_embed on public.soma_entries;
create trigger soma_entries_embed
  after insert or update of note, sleep, energy, motivation, fatigue, doms, stress
  on public.soma_entries
  for each row
  execute function public.trigger_embed_entry();
