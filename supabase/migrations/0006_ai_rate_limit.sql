-- Rate limiting płatnych wywołań Logana (model xAI) — wspólny dzienny licznik per użytkownik.
-- Chroni przed nabijaniem kosztów przez posiadacza tokenu API (/ask, MCP ask_logan) oraz
-- przez webowy czat/analizę (funkcja `agent`). Jedno okno = jeden dzień (Europe/Warsaw).
create table if not exists public.soma_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,        -- dzień okna w strefie Europe/Warsaw
  count int not null default 0,    -- liczba zapytań w danym oknie
  primary key (user_id, usage_date)
);

comment on table public.soma_ai_usage is 'Dzienny licznik zapytań do Logana per użytkownik (rate limiting płatnego modelu xAI).';

-- Brak polityk RLS: tabela dostępna tylko przez service-role oraz funkcję SECURITY DEFINER poniżej.
alter table public.soma_ai_usage enable row level security;

-- Atomowo zwiększa licznik dnia i mówi, czy żądanie mieści się w limicie.
-- `p_user_id` podaje funkcja `api` (klient service-role, auth.uid() = null); funkcja `agent`
-- (klient JWT) pomija go i polega na auth.uid(). Gdy użytkownika nie da się ustalić — nie blokujemy.
create or replace function public.soma_ai_rate_limit(
  p_limit int,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := coalesce(p_user_id, auth.uid());
  v_day date := (now() at time zone 'Europe/Warsaw')::date;
  v_count int;
  v_reset timestamptz := ((v_day + 1)::timestamp at time zone 'Europe/Warsaw'); -- najbliższa północ warszawska
begin
  if v_user is null then
    -- nie umiemy przypisać użycia (brak/nieważny użytkownik) → nie rate-limitujemy tutaj
    return jsonb_build_object('allowed', true, 'count', 0, 'limit', p_limit, 'reason', 'no_user');
  end if;

  -- Inkrementuj tylko dopóki jesteśmy poniżej limitu. Gdy limit osiągnięty, WHERE blokuje UPDATE,
  -- RETURNING nic nie zwraca (v_count = null) i licznik nie rośnie w nieskończoność.
  insert into public.soma_ai_usage (user_id, usage_date, count)
  values (v_user, v_day, 1)
  on conflict (user_id, usage_date)
    do update set count = soma_ai_usage.count + 1
    where soma_ai_usage.count < p_limit
  returning count into v_count;

  if v_count is null then
    select count into v_count from public.soma_ai_usage
      where user_id = v_user and usage_date = v_day;
    return jsonb_build_object('allowed', false, 'count', v_count, 'limit', p_limit, 'reset_at', v_reset);
  end if;

  return jsonb_build_object('allowed', true, 'count', v_count, 'limit', p_limit, 'reset_at', v_reset);
end;
$$;

-- Funkcja `agent` woła RPC klientem JWT (rola authenticated); funkcja `api` — service_role.
grant execute on function public.soma_ai_rate_limit(int, uuid) to authenticated, service_role;
