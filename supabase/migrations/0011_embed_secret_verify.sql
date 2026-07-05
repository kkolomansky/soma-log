-- Weryfikacja sekretu webhooka embed-entry po stronie bazy. Funkcja embed-entry ma verify_jwt=false
-- i jest wołana przez trigger (pg_net) z nagłówkiem x-embed-secret. Zamiast trzymać sekret w env
-- funkcji (czego nie ustawimy bez CLI), funkcja pyta ten RPC, który porównuje kandydata z sekretem
-- z Vault. Sekret NIGDY nie opuszcza bazy (RPC zwraca tylko boolean). Dostęp wyłącznie dla service_role.
create or replace function public.verify_embed_secret(candidate text)
  returns boolean
  language sql
  security definer
  set search_path = vault, public
  stable
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'embed_webhook_secret'
      and decrypted_secret = candidate
      and candidate <> ''
  );
$$;

revoke execute on function public.verify_embed_secret(text) from public, anon, authenticated;
grant execute on function public.verify_embed_secret(text) to service_role;
