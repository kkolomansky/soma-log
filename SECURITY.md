# Bezpieczeństwo SomaLog

Skrót modelu bezpieczeństwa i warstw hartowania. Szczegóły izolacji danych są w migracjach
(`supabase/migrations`) i w kodzie funkcji (`supabase/functions`).

## Izolacja danych (baza + bucket)

- **RLS** włączone na wszystkich tabelach (`soma_entries`, `soma_chat_messages`,
  `soma_api_tokens`, `soma_user_settings`) z politykami `auth.uid() = user_id`.
- **Bucket `soma-photos`** prywatny; RLS na `storage.objects` izoluje po folderze
  `(storage.foldername(name))[1] = auth.uid()`; limit 10 MB + whitelista MIME.
- **Funkcje RPC** (`hybrid_search_soma_entries`, `match_soma_entries`, `soma_ai_rate_limit`)
  są `SECURITY DEFINER` z ustawionym `search_path` i izolacją przez
  `coalesce(auth.uid(), filter_user_id)` (brak IDOR).
- **Publiczne API (`api`)** używa service-role (omija RLS), więc **każde** zapytanie
  filtruje ręcznie po `.eq("user_id", userId)`. Token API jest hashowany SHA-256, z obsługą
  odwołania (`revoked_at`).
- **Sekrety** (service-role, `XAI_API_KEY`, `OPENAI_API_KEY`, `embed_webhook_secret`) tylko
  po stronie serwera. W przeglądarce wyłącznie klucz `anon`.

## Nagłówki bezpieczeństwa (`vercel.json`)

Ustawiane dla wszystkich ścieżek:

| Nagłówek | Wartość |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.functions.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), geolocation=(), microphone=(self)` (mikrofon dla transkrypcji głosowej) |

Uwaga: nie używamy `'unsafe-inline'`/`'unsafe-eval'` w `script-src` (aplikacja nie ma inline JS).
Jeśli dojdzie zewnętrzny host (np. inna instancja Supabase), rozszerz `connect-src`/`img-src`
o konkretny origin — nie osłabiaj `script-src`.

## CORS

- Funkcje obsługujące aplikację (`agent`, `tokens`, `tts`, `transcribe`) używają allowlisty
  origin z helpera `corsHeaders(req)` w `supabase/functions/_shared/logan.ts`, sterowanej
  sekretem **`APP_ORIGINS`** (CSV; domyślnie domena prod + `http://localhost:5173`).
- Publiczne, tokenowe API (`api`) oraz webhook `embed-entry` celowo zostają na `Origin: *`
  — dostęp cross-origin z przeglądarki jest tam zamierzony, a ochronę zapewnia token/sekret,
  nie ciasteczka.

## Wdrożenie

```bash
supabase secrets set APP_ORIGINS="https://twoja-domena.vercel.app,http://localhost:5173"
supabase functions deploy agent api tokens tts transcribe
```

Nagłówki z `vercel.json` działają po deployu na Vercel — zweryfikuj: `curl -I https://<domena>/`.
