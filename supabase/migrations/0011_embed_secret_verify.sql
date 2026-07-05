-- Weryfikacja sekretu webhooka embed-entry po stronie bazy. Funkcja embed-entry ma verify_jwt=false
-- i jest wołana przez trigger (pg_net) z nagłówkiem x-embed-secret. Zamiast trzymać sekret w env
-- funkcji (czego nie ustawimy bez CLI), funkcja pyta ten RPC, który porównuje kandydata z sekretem
-- z Vault. Sekret NIGDY nie opuszcza bazy (RPC zwraca tylko boolean). Dostęp wyłącznie dla service_role.
--
-- plpgsql (nie sql), żeby ciało NIE było walidowane względem vault.decrypted_secrets przy tworzeniu
-- funkcji — dzięki temu migracja przechodzi też tam, gdzie Vault nie jest jeszcze skonfigurowany
-- (np. świeża baza preview w Supabase Branching). Gdyby w runtime Vault był niedostępny, handler
-- zwraca false (odmowa) — bezpieczny domyślny stan.
create or replace function public.verify_embed_secret(candidate text)
  returns boolean
  language plpgsql
  security definer
  set search_path = vault, public
  stable
as $$
begin
  return exists (
    select 1 from vault.decrypted_secrets
    where name = 'embed_webhook_secret'
      and decrypted_secret = candidate
      and candidate <> ''
  );
exception
  when undefined_table or undefined_function or undefined_object or insufficient_privilege then
    return false;
end;
$$;

revoke execute on function public.verify_embed_secret(text) from public, anon, authenticated;
grant execute on function public.verify_embed_secret(text) to service_role;
