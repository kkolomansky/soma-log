import { useState, useEffect, useRef } from 'react';
import { LogoFull } from '../components/Logo';
import { navigate } from '../lib/nav';
import { API_BASE } from '../lib/apiTokens';

// Struktura nawigacji (lewa kolumna) — grupy i pozycje kotwiczące do sekcji treści.
const NAV = [
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

const ALL_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

function MethodBadge({ method }) {
  const color = method === 'GET' ? 'text-recovery bg-recovery/10' : 'text-sleep bg-sleep/10';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${color}`}>
      {method}
    </span>
  );
}

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* brak dostępu do schowka */ }
  };
  return (
    <div className="relative group rounded-xl border border-border bg-[#0E1413] overflow-hidden">
      {label && (
        <div className="flex items-center justify-between border-b border-border px-3.5 py-1.5">
          <span className="font-mono text-[11px] text-txt-3">{label}</span>
        </div>
      )}
      <button
        onClick={copy}
        className="absolute top-2 right-2 rounded-md border border-border-strong bg-surface/80 px-2 py-1 text-[11px] text-txt-3 hover:text-txt opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Skopiowano' : 'Kopiuj'}
      </button>
      <pre className="overflow-x-auto px-3.5 py-3 text-[12.5px] leading-relaxed">
        <code className="font-mono text-txt-2 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

// Tabela parametrów — kolumny: parametr / typ / opis (styl referencyjny jak w docs Vercela).
function ParamTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-txt-3">
            <th className="px-3.5 py-2 font-medium">Parametr</th>
            <th className="px-3.5 py-2 font-medium">Typ</th>
            <th className="px-3.5 py-2 font-medium">Opis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-divider last:border-0 align-top">
              <td className="px-3.5 py-2.5 whitespace-nowrap">
                <span className="font-mono text-txt">{r.name}</span>
                {r.required
                  ? <span className="ml-1.5 text-[10px] font-semibold text-danger">wymagane</span>
                  : <span className="ml-1.5 text-[10px] text-txt-3">opcjonalne</span>}
              </td>
              <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-txt-3">{r.type}</td>
              <td className="px-3.5 py-2.5 text-txt-2">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Endpoint({ id, method, path, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-2">
      <h2 className="font-display text-2xl font-semibold text-txt">{title}</h2>
      <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
        <MethodBadge method={method} />
        <code className="font-mono text-[13px] text-txt-2 break-all">{path}</code>
      </div>
      <div className="mt-5 space-y-5 text-[14px] leading-relaxed text-txt-2">{children}</div>
    </section>
  );
}

function SubHeading({ children }) {
  return <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-txt-3">{children}</h3>;
}

export default function Docs() {
  const [active, setActive] = useState(ALL_IDS[0]);
  const clickLock = useRef(0);

  // Scrollspy — podświetla pozycję nawigacji odpowiadającą widocznej sekcji.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < clickLock.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );
    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const go = (id) => (e) => {
    e.preventDefault();
    setActive(id);
    clickLock.current = Date.now() + 700; // chwilowo blokuj scrollspy, by klik był stabilny
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState({}, '', `/docs#${id}`);
  };

  const AUTH_HEADERS = `apikey: <PUBLICZNY_KLUCZ_ANON>\nAuthorization: Bearer <TWÓJ_TOKEN>`;

  return (
    <div className="min-h-screen bg-bg text-txt">
      {/* Górny pasek */}
      <header className="sticky top-0 z-10 border-b border-divider bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <button onClick={() => navigate('/')} className="flex items-center" aria-label="Strona główna">
            <LogoFull size={34} />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-[0.18em] text-txt-3">Dokumentacja API</span>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-txt-2 hover:text-txt hover:bg-elevated transition-colors"
            >
              ← Do aplikacji
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-5">
        {/* Lewa kolumna nawigacji */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-20 py-8 space-y-6">
            {NAV.map((group) => (
              <div key={group.label}>
                <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-wider text-txt-3">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const on = active === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={go(item.id)}
                          className={`block rounded-md px-2.5 py-1.5 text-[13px] transition-colors border-l-2 ${
                            on
                              ? 'border-recovery text-txt bg-recovery/5 font-medium'
                              : 'border-transparent text-txt-3 hover:text-txt hover:bg-surface'
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Treść */}
        <main className="min-w-0 flex-1 py-8 max-w-3xl">
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
                Token wygenerujesz w aplikacji: <span className="text-txt">Panel użytkownika → Tokeny API → „Generuj nowy token"</span>.
                Token pokazywany jest jednorazowo — skopiuj go od razu.
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
            <Endpoint id="create" method="POST" path="/entries" title="Create">
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
                    code={`{\n  "entry": {\n    "entry_date": "2026-07-04",\n    "sleep": 80,\n    "energy": 50,\n    "motivation": 50,\n    "fatigue": 50,\n    "doms": 50,\n    "stress": 30,\n    "note": "lekki trening"\n  }\n}`}
                  />
                </div>
              </div>
            </Endpoint>
          </div>

          {/* Ask */}
          <div className="pt-14">
            <Endpoint id="ask" method="POST" path="/ask" title="Ask">
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
                    code={`curl -X POST "${API_BASE}/ask" \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -H "Authorization: Bearer $SOMALOG_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "question": "Jak moja regeneracja?", "date": "2026-07-04" }'`}
                  />
                </div>
              </div>
              <div>
                <SubHeading>Odpowiedź 200</SubHeading>
                <div className="mt-2">
                  <CodeBlock code={`{\n  "answer": "Regeneracja jest słaba — niski sen i wysokie DOMS…",\n  "entryDate": "2026-07-04"\n}`} />
                </div>
              </div>
            </Endpoint>
          </div>

          {/* Read */}
          <div className="pt-14 pb-24">
            <Endpoint id="read" method="GET" path="/entries?date=YYYY-MM-DD" title="Read">
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
                    code={`curl "${API_BASE}/entries?date=2026-07-04" \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -H "Authorization: Bearer $SOMALOG_TOKEN"`}
                  />
                </div>
              </div>
              <div>
                <SubHeading>Odpowiedź 200</SubHeading>
                <div className="mt-2">
                  <CodeBlock code={`{\n  "entry": {\n    "entry_date": "2026-07-04",\n    "sleep": 26,\n    "energy": 50,\n    "motivation": 76,\n    "fatigue": 29,\n    "doms": 77,\n    "stress": 25,\n    "note": "lekko przetrenowany"\n  }\n}`} />
                </div>
              </div>
            </Endpoint>
          </div>
        </main>
      </div>
    </div>
  );
}
