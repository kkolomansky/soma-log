-- Odczyt własnego dziennego zużycia limitu Logana — do podglądu w panelu użytkownika.
-- Tabela soma_ai_usage ma RLS bez polityk (zapis tylko service-role / SECURITY DEFINER),
-- więc udostępniamy odczyt przez dedykowaną funkcję, która NIE zwiększa licznika.
create or replace function public.soma_ai_usage_today()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'count', coalesce((
      select count from public.soma_ai_usage
      where user_id = auth.uid()
        and usage_date = (now() at time zone 'Europe/Warsaw')::date
    ), 0),
    'reset_at', (((now() at time zone 'Europe/Warsaw')::date + 1)::timestamp at time zone 'Europe/Warsaw')
  );
$$;

grant execute on function public.soma_ai_usage_today() to authenticated;
