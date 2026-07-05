-- Naprawa IDOR w match_soma_entries (0008): funkcja jest SECURITY DEFINER i wystawiona przez
-- PostgREST (/rest/v1/rpc/match_soma_entries), a przyjmuje `filter_user_id`, który zalogowany
-- użytkownik mógł nadpisać cudzym id i — omijając RLS — odczytać notatki innej osoby.
-- Fix jak w hybrid_search_soma_entries (0009): efektywny user = coalesce(auth.uid(), filter_user_id).
-- Zalogowany widzi TYLKO siebie (param ignorowany), service-role (auth.uid() null) podaje jawnie.
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
    and e.user_id = coalesce(auth.uid(), filter_user_id)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
