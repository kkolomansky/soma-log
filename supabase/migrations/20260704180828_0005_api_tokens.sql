-- Osobiste tokeny API SomaLog (per konto) — pozwalają sterować aplikacją spoza UI
-- (skrypty, automatyzacje, iOS Shortcuts, cron) przez publiczne endpointy funkcji `api`.
-- Token pokazywany jest raz przy utworzeniu; w bazie trzymamy tylko jego SHA-256 hash.
create table if not exists public.soma_api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  token_prefix text not null,      -- np. "somalog_1a2b3c4d" — do rozpoznania na liście
  token_hash text not null unique, -- SHA-256 (hex) pełnego tokenu
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

comment on table public.soma_api_tokens is 'Osobiste tokeny API SomaLog (per konto) — hash tokenu do autoryzacji endpointów funkcji api';

create index if not exists soma_api_tokens_hash_idx on public.soma_api_tokens (token_hash);

alter table public.soma_api_tokens enable row level security;

-- Użytkownik zarządza własnymi tokenami z aplikacji (walidacja przy wywołaniu API idzie service-role).
create policy "users read own tokens"
  on public.soma_api_tokens for select
  using (auth.uid() = user_id);

create policy "users insert own tokens"
  on public.soma_api_tokens for insert
  with check (auth.uid() = user_id);

create policy "users delete own tokens"
  on public.soma_api_tokens for delete
  using (auth.uid() = user_id);
