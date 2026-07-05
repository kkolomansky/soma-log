-- Trwałe podsumowanie analizy AI dla danego dnia
alter table public.soma_entries
  add column if not exists ai_summary text;

-- Wiadomości rozmowy z agentem AI, per użytkownik i dzień
create table if not exists public.soma_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.soma_chat_messages is 'Rozmowa z agentem AI (SomaLog) — wiadomości per użytkownik i dzień';

create index if not exists soma_chat_messages_user_date_idx
  on public.soma_chat_messages (user_id, entry_date, created_at);

alter table public.soma_chat_messages enable row level security;

create policy "users read own messages"
  on public.soma_chat_messages for select
  using (auth.uid() = user_id);

create policy "users insert own messages"
  on public.soma_chat_messages for insert
  with check (auth.uid() = user_id);

create policy "users delete own messages"
  on public.soma_chat_messages for delete
  using (auth.uid() = user_id);
