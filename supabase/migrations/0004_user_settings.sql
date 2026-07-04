-- Ustawienia użytkownika (per konto) — na razie wybór głosu lektora Logana (xAI TTS).
-- Trwałość między sesjami i urządzeniami: aplikacja czyta go po zalogowaniu
-- (loadVoiceFromServer) i zapisuje przy wyborze (saveVoiceToServer).
create table if not exists public.soma_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  voice text not null default 'leo',
  updated_at timestamptz not null default now()
);

comment on table public.soma_user_settings is 'Ustawienia użytkownika SomaLog (per konto) — m.in. wybrany głos Logana';

alter table public.soma_user_settings enable row level security;

create policy "users read own settings"
  on public.soma_user_settings for select
  using (auth.uid() = user_id);

create policy "users insert own settings"
  on public.soma_user_settings for insert
  with check (auth.uid() = user_id);

create policy "users update own settings"
  on public.soma_user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
