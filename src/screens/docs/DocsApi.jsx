import { API_BASE } from '../../lib/apiTokens';
import { MethodBadge, CodeBlock, ParamTable, Endpoint, SubHeading } from './ui';

// Nawigacja podstrony API (spójny pasek boczny).
export const NAV_API = [
  {
    label: 'Wprowadzenie',
    items: [
      { id: 'przeglad', label: 'Przegląd' },
      { id: 'autoryzacja', label: 'Autoryzacja' },
    ],
  },
  {
    label: 'API',
    items: [
      { id: 'create', label: 'Create' },
      { id: 'ask', label: 'Ask' },
      { id: 'read', label: 'Read' },
    ],
  },
];

const AUTH_HEADERS = `apikey: <PUBLICZNY_KLUCZ_ANON>\nAuthorization: Bearer <TWÓJ_TOKEN>`;

export default function DocsApi() {
  return (
    <>
      {/* Przegląd */}
      <section id="przeglad" className="scroll-mt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-recovery">API SomaLog</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-txt">Dokumentacja API</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-txt-2">
          REST API pozwala sterować SomaLog spoza aplikacji — dodawać wpisy, pytać trenera Logana i odczytywać dane
          danego dnia. Każde żądanie działa w kontekście jednego użytkownika, wyznaczonego przez osobisty token API.
          Wszystkie odpowiedzi mają format JSON.
        </p>
        <div className="mt-5">
          <SubHeading>Base URL</SubHeading>
          <div className="mt-2">
            <CodeBlock code={API_BASE} />
          </div>
        </div>
      </section>

      {/* Autoryzacja */}
      <section id="autoryzacja" className="scroll-mt-24 pt-14">
        <h2 className="font-display text-2xl font-semibold text-txt">Autoryzacja</h2>
        <div className="mt-4 space-y-5 text-[14px] leading-relaxed text-txt-2">
          <p>
            Każde żądanie wymaga dwóch nagłówków: publicznego klucza <code className="font-mono text-txt">apikey</code>
            {' '}(klucz anon projektu) oraz osobistego tokenu w nagłówku <code className="font-mono text-txt">Authorization</code>.
            Token wygenerujesz przyciskiem <span className="text-txt">„Generuj token"</span> na górze tej strony
            (albo w aplikacji: Panel użytkownika → Tokeny API). Token pokazywany jest jednorazowo — skopiuj go od razu.
          </p>
          <CodeBlock label="Nagłówki" code={AUTH_HEADERS} />
          <div>
            <SubHeading>Kody błędów</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: '400', type: 'Bad Request', desc: 'Nieprawidłowe dane (np. parametr spoza zakresu 0–100 lub zła data).', required: false },
                  { name: '401', type: 'Unauthorized', desc: 'Brak, nieprawidłowy lub odwołany token.', required: false },
                  { name: '404', type: 'Not Found', desc: 'Nieznana ścieżka (użyj /entries lub /ask).', required: false },
                  { name: '502', type: 'Bad Gateway', desc: 'Błąd usługi AI przy zapytaniu do Logana.', required: false },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Create */}
      <div className="pt-14">
        <Endpoint id="create" badge={<MethodBadge method="POST" />} signature="/entries" title="Create">
          <p>
            Tworzy wpis na wskazany dzień lub scala go z istniejącym. Bez pola <code className="font-mono text-txt">date</code>
            {' '}wpis dotyczy dnia dzisiejszego (strefa Europe/Warsaw). Podane parametry aktualizują tylko swoje pola —
            pozostałe wartości istniejącego wpisu zostają nietknięte. Przy zupełnie nowym wpisie brakujące metryki
            przyjmują neutralną wartość <code className="font-mono text-txt">50</code>. Trzeba podać co najmniej jeden parametr lub notatkę.
          </p>
          <div>
            <SubHeading>Body (JSON)</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: 'date', type: 'string', desc: 'Dzień w formacie YYYY-MM-DD. Domyślnie dziś.', required: false },
                  { name: 'sleep', type: 'integer', desc: 'Sen, 0–100 (wyżej = lepiej).', required: false },
                  { name: 'energy', type: 'integer', desc: 'Energia, 0–100 (wyżej = lepiej).', required: false },
                  { name: 'motivation', type: 'integer', desc: 'Motywacja, 0–100 (wyżej = lepiej).', required: false },
                  { name: 'fatigue', type: 'integer', desc: 'Zmęczenie, 0–100 (niżej = lepiej).', required: false },
                  { name: 'doms', type: 'integer', desc: 'Bolesność mięśni (DOMS), 0–100 (niżej = lepiej).', required: false },
                  { name: 'stress', type: 'integer', desc: 'Stres, 0–100 (niżej = lepiej).', required: false },
                  { name: 'note', type: 'string', desc: 'Notatka tekstowa do dnia.', required: false },
                ]}
              />
            </div>
          </div>
          <div>
            <SubHeading>Przykład</SubHeading>
            <div className="mt-2">
              <CodeBlock
                label="cURL"
                code={`curl -X POST "${API_BASE}/entries" \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -H "Authorization: Bearer $SOMALOG_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "sleep": 80, "stress": 30, "note": "lekki trening" }'`}
              />
            </div>
          </div>
          <div>
            <SubHeading>Odpowiedź 200</SubHeading>
            <div className="mt-2">
              <CodeBlock
                code={`{\n  "entry": {\n    "entry_date": "2026-07-05",\n    "sleep": 80,\n    "energy": 50,\n    "motivation": 50,\n    "fatigue": 50,\n    "doms": 50,\n    "stress": 30,\n    "note": "lekki trening"\n  }\n}`}
              />
            </div>
          </div>
        </Endpoint>
      </div>

      {/* Ask */}
      <div className="pt-14">
        <Endpoint id="ask" badge={<MethodBadge method="POST" />} signature="/ask" title="Ask">
          <p>
            Zadaje pytanie trenerowi Logan i zwraca jego odpowiedź. Zapytanie jest bezstanowe — nie trafia do historii
            rozmowy w aplikacji. Opcjonalne pole <code className="font-mono text-txt">date</code> wskazuje dzień, którego wpis
            zostanie użyty jako kontekst (domyślnie dziś). Logan może też sięgnąć po wcześniejsze wpisy, by ocenić trend.
          </p>
          <div>
            <SubHeading>Body (JSON)</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: 'question', type: 'string', desc: 'Treść pytania do Logana.', required: true },
                  { name: 'date', type: 'string', desc: 'Dzień kontekstu w formacie YYYY-MM-DD. Domyślnie dziś.', required: false },
                ]}
              />
            </div>
          </div>
          <div>
            <SubHeading>Przykład</SubHeading>
            <div className="mt-2">
              <CodeBlock
                label="cURL"
                code={`curl -X POST "${API_BASE}/ask" \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -H "Authorization: Bearer $SOMALOG_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "question": "Jak moja regeneracja?", "date": "2026-07-05" }'`}
              />
            </div>
          </div>
          <div>
            <SubHeading>Odpowiedź 200</SubHeading>
            <div className="mt-2">
              <CodeBlock code={`{\n  "answer": "Regeneracja jest słaba — niski sen i wysokie DOMS…",\n  "entryDate": "2026-07-05"\n}`} />
            </div>
          </div>
        </Endpoint>
      </div>

      {/* Read */}
      <div className="pt-14 pb-24">
        <Endpoint id="read" badge={<MethodBadge method="GET" />} signature="/entries?date=YYYY-MM-DD" title="Read">
          <p>
            Zwraca wpis na wskazany dzień. Bez parametru <code className="font-mono text-txt">date</code> zwraca wpis dzisiejszy
            (strefa Europe/Warsaw). Gdy wpisu nie ma, pole <code className="font-mono text-txt">entry</code> jest{' '}
            <code className="font-mono text-txt">null</code>.
          </p>
          <div>
            <SubHeading>Query</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: 'date', type: 'string', desc: 'Dzień w formacie YYYY-MM-DD. Domyślnie dziś.', required: false },
                ]}
              />
            </div>
          </div>
          <div>
            <SubHeading>Przykład</SubHeading>
            <div className="mt-2">
              <CodeBlock
                label="cURL"
                code={`curl "${API_BASE}/entries?date=2026-07-05" \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -H "Authorization: Bearer $SOMALOG_TOKEN"`}
              />
            </div>
          </div>
          <div>
            <SubHeading>Odpowiedź 200</SubHeading>
            <div className="mt-2">
              <CodeBlock code={`{\n  "entry": {\n    "entry_date": "2026-07-05",\n    "sleep": 26,\n    "energy": 50,\n    "motivation": 76,\n    "fatigue": 29,\n    "doms": 77,\n    "stress": 25,\n    "note": "lekko przetrenowany"\n  }\n}`} />
            </div>
          </div>
        </Endpoint>
      </div>
    </>
  );
}
