# Architektura SomaLog

Dziennik samopoczucia i regeneracji z trenerem AI („Logan"). Użytkownik codziennie ocenia 6 metryk (0–100) i dopisuje notatkę; aplikacja liczy trendy i pozwala rozmawiać z asystentem AI, który zna historię wpisów.

## Stack

| Warstwa | Technologia |
| --- | --- |
| Frontend | React 18 + Vite 5, Tailwind CSS 3 |
| Backend / dane | Supabase (Postgres 17, Auth, Storage, RLS, Edge Functions w Deno) |
| Hosting | Vercel — frontend (SPA) + funkcja serverless `/api/mcp` |
| AI | xAI Grok (czat, transkrypcja mowy, synteza mowy), OpenAI (embeddingi do wyszukiwania) |

Produkcja: `https://soma-log-umber.vercel.app`.

## Mapa repozytorium

```
src/                     # Frontend (React)
  screens/               # Ekrany: Auth, Trends (główny), Docs, ResetPassword
    docs/                # Dokumentacja API i MCP (DocsApi, DocsMcp)
  components/            # Komponenty UI (wykres, karuzela, czat, karty analizy…)
  hooks/                 # Hooki (dyktowanie głosem, typewriter…)
  lib/                   # Klient Supabase + wywołania API (agent, tokeny, zdjęcia, konto)
  layouts/, utils/       # Layout i funkcje pomocnicze (daty itp.)

api/
  mcp.ts                 # Serwer MCP (Model Context Protocol) — funkcja serverless Vercel

supabase/
  functions/             # Edge Functions (Deno) — logika serwerowa
    _shared/logan.ts     # Współdzielona persona Logana, metryki, wywołania xAI/OpenAI, CORS
    agent/               # Czat i analiza dnia z Loganem (JWT użytkownika)
    api/                 # Publiczne REST API (autoryzacja osobistym tokenem)
    transcribe/          # Mowa → tekst (proxy do xAI STT)
    tts/                 # Tekst → mowa (proxy do xAI TTS)
    tokens/              # Zarządzanie osobistymi tokenami API
    delete-account/      # Usunięcie konta i danych użytkownika
    embed-entry/         # Generowanie embeddingu wpisu (wołane triggerem bazy)
  migrations/            # Wersjonowane migracje SQL (schemat, RLS, funkcje RPC)
```

## Model danych (Postgres + RLS)

Wszystkie tabele użytkownika chroni **Row Level Security** — każdy widzi i modyfikuje wyłącznie własne wiersze (`user_id = auth.uid()`).

- **`soma_entries`** — dzienne wpisy: `entry_date`, 6 metryk (`sleep`, `energy`, `motivation`, `fatigue`, `doms`, `stress`), `note`, `photos` (jsonb), `ai_summary`, `embedding` (wektor do wyszukiwania semantycznego).
- **`soma_chat_messages`** — historia rozmów z Loganem per dzień.
- **`soma_api_tokens`** — osobiste tokeny do publicznego API/MCP (w bazie tylko hash SHA-256; plaintext pokazywany raz przy tworzeniu).
- **Storage:** prywatny bucket `soma-photos` na zdjęcia per dzień.
- **RPC:** `hybrid_search_soma_entries` (wyszukiwanie hybrydowe), `soma_ai_rate_limit` (dzienny limit zapytań do AI).

## Edge Functions i autoryzacja

Dwa modele autoryzacji:

1. **JWT zalogowanego użytkownika** — funkcje obsługujące aplikację webową. Klient wysyła token sesji Supabase; funkcja działa pod RLS użytkownika. Dotyczy: `agent`, `tokens`, `delete-account`, `transcribe`, `tts`. Bramka `verify_jwt = true` odrzuca żądania bez ważnego JWT, a funkcje proxujące do płatnego xAI (`transcribe`, `tts`) **dodatkowo** potwierdzają realną sesję przez `supabase.auth.getUser()` (sam klucz anon nie wystarczy).
2. **Osobisty token API** (`somalog_...`) — publiczne API (`api`) i serwer MCP. `verify_jwt = false`; funkcja sama waliduje token (porównanie hashu) i ręcznie filtruje dane po `user_id` (klient service-role omija RLS).
3. **Sekret nagłówkowy** — `embed-entry` jest wołana przez trigger bazy (pg_net), nie przez użytkownika; chroni ją nagłówek `x-embed-secret`.

CORS: funkcje aplikacyjne mają zawężoną allowlistę origin (`APP_ORIGINS`, domyślnie domena prod + localhost). Publiczne API i webhook celowo zostają na `Origin: *`, bo i tak chroni je token.

## Trener AI „Logan"

- **Czat** (`agent`, tryb chat): odpowiedź strumieniowa (SSE z xAI → tekst do klienta). Renderowana w oknie czatu jako markdown.
- **Analiza dnia** (`agent`, tryb summary): rozbudowane podsumowanie + skrót; opcjonalnie odczytywane głosem (`tts`).
- **Retrieval hybrydowy:** do kontekstu Logana trafiają wpisy z ostatnich 7 dni **oraz** wpisy dopasowane wyszukiwaniem semantycznym (embeddingi OpenAI) + pełnotekstowym. Embeddingi liczy się automatycznie triggerem przy zapisie wpisu (`embed-entry`).
- **Limit:** wspólny dzienny limit zapytań do AI per konto (REST `/ask`, MCP, czat webowy).

## Publiczne API i MCP

- **REST API** (`supabase/functions/api`): `POST /entries`, `POST /ask`, `GET /entries?date=…`. Autoryzacja: `Authorization: Bearer somalog_…`. Dokumentacja: `/docs`.
- **Serwer MCP** (`api/mcp.ts` na Vercel, transport Streamable HTTP): narzędzia `create_entry`, `ask_logan`, `get_entry` dla agentów AI. Autoryzacja tym samym tokenem. Dokumentacja: `/docs/mcp`.

## Bezpieczeństwo sekretów

- Repo zawiera wyłącznie `.env.example` (szablon z placeholderami). Realne wartości są w `.env.local` (ignorowane przez `.gitignore`).
- Frontend (bundle publiczny) używa tylko kluczy publicznych: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Prawdziwe sekrety (`XAI_API_KEY`, `OPENAI_API_KEY`, service-role, `APP_ORIGINS`, `x-embed-secret`) żyją po stronie Supabase (Edge Functions → Secrets), nigdy w kodzie.

## Przepływ deweloperski

- Praca na gałęziach `claude/…` odbitych od `main`, scalanie przez Pull Requesty. `main` = wersja produkcyjna (auto-deploy frontendu na Vercel).
- Migracje SQL wersjonowane w `supabase/migrations` (nazwy `TIMESTAMP_opis.sql` zgodne z historią produkcji — wymaga tego Supabase Branching).
- Edge Functions wdraża się osobno (Supabase CLI lub panel) — nie są objęte auto-deployem frontendu.
