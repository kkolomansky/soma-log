-- Fundament tabeli soma_entries. Pierwotnie utworzony przez dashboard/MCP i NIGDY nie zapisany jako
-- plik migracji, przez co Supabase Branching (odtwarzający bazę od zera z plików repo) padał już na
-- pierwszej migracji (0002 robi ALTER na nieistniejącej tabeli). Ten plik dopełnia historię.
-- Wszystko idempotentne, więc bezpieczne również przy ponownym zastosowaniu na istniejącej bazie.
-- Kolumny ai_summary (0002), ai_summary_short (0003), embedding (0008) oraz indeksy semantyczne
-- (0008/0009) dokładają kolejne migracje — tutaj tylko stan sprzed 0002.

create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.soma_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date  date not null default ((now() at time zone 'Europe/Warsaw')::date),
  -- Metryki 0–100. mood/recovery to pozostałości wcześniejszej wersji skali (nieużywane przez app,
  -- zachowane dla zgodności ze stanem produkcji). Docelowe 6 metryk: sleep/energy/motivation/
  -- fatigue/doms/stress.
  mood        smallint,
  recovery    smallint,
  sleep       smallint not null,
  energy      smallint not null default 50,
  motivation  smallint not null default 50,
  fatigue     smallint not null default 50,
  doms        smallint not null,
  stress      smallint not null default 50,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint soma_entries_mood_check       check (mood >= 0 and mood <= 100),
  constraint soma_entries_recovery_check   check (recovery >= 0 and recovery <= 100),
  constraint soma_entries_sleep_check      check (sleep >= 0 and sleep <= 100),
  constraint soma_entries_energy_check     check (energy >= 0 and energy <= 100),
  constraint soma_entries_motivation_check check (motivation >= 0 and motivation <= 100),
  constraint soma_entries_fatigue_check    check (fatigue >= 0 and fatigue <= 100),
  constraint soma_entries_doms_check       check (doms >= 0 and doms <= 100),
  constraint soma_entries_stress_check     check (stress >= 0 and stress <= 100),
  constraint soma_entries_user_day_unique  unique (user_id, entry_date)
);

create index if not exists soma_entries_user_id_idx    on public.soma_entries (user_id);
create index if not exists soma_entries_created_at_idx on public.soma_entries (created_at desc);

drop trigger if exists trg_soma_entries_updated_at on public.soma_entries;
create trigger trg_soma_entries_updated_at
  before update on public.soma_entries
  for each row execute function public.set_updated_at();

alter table public.soma_entries enable row level security;

drop policy if exists "users read own entries" on public.soma_entries;
create policy "users read own entries" on public.soma_entries
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users insert own entries" on public.soma_entries;
create policy "users insert own entries" on public.soma_entries
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users update own entries" on public.soma_entries;
create policy "users update own entries" on public.soma_entries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own entries" on public.soma_entries;
create policy "users delete own entries" on public.soma_entries
  for delete to authenticated using (auth.uid() = user_id);
