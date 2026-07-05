-- Włącz pgvector i dodaj kolumnę embeddingu do wpisów SomaLog.
-- Wektory generowane modelem OpenAI text-embedding-3-small (1536 wymiarów), jeden wektor = jeden wpis.
-- Kompozyt do embeddingu: data + 6 metryk (sen/energia/motywacja/zmęczenie/DOMS/stres) + notatka.
create extension if not exists vector with schema extensions;

alter table public.soma_entries
  add column if not exists embedding extensions.vector(1536);

comment on column public.soma_entries.embedding is
  'Embedding OpenAI text-embedding-3-small (1536d) z kompozytu: data + 6 metryk + notatka. Do wyszukiwania semantycznego.';

-- Wyszukiwanie semantyczne po wpisach danego użytkownika (cosine distance).
create or replace function public.match_soma_entries(
  query_embedding extensions.vector(1536),
  match_count int default 10,
  filter_user_id uuid default auth.uid()
)
returns table (
  id uuid,
  entry_date date,
  note text,
  similarity float
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    e.id,
    e.entry_date,
    e.note,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.soma_entries e
  where e.embedding is not null
    and e.user_id = filter_user_id
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_soma_entries(extensions.vector(1536), int, uuid)
  to authenticated, service_role;

-- Indeks HNSW (cosine) do szybkiego wyszukiwania najbliższych sąsiadów po embeddingu.
create index if not exists soma_entries_embedding_idx
  on public.soma_entries using hnsw (embedding vector_cosine_ops);
