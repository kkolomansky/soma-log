import { CodeBlock, ParamTable, Endpoint, SubHeading, ToolBadge } from './ui';

// Nawigacja podstrony MCP (spójny pasek boczny).
export const NAV_MCP = [
  {
    label: 'Wprowadzenie',
    items: [
      { id: 'przeglad', label: 'Przegląd' },
      { id: 'konfiguracja', label: 'Konfiguracja' },
    ],
  },
  {
    label: 'Narzędzia',
    items: [
      { id: 'create_entry', label: 'create_entry' },
      { id: 'ask_logan', label: 'ask_logan' },
      { id: 'get_entry', label: 'get_entry' },
    ],
  },
];

// URL serwera MCP = ten sam origin co docs (kolokacja w projekcie Vercel), ścieżka /api/mcp.
const MCP_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : '/api/mcp';

const CLI_SNIPPET = `claude mcp add --transport http somalog \\\n  ${MCP_URL} \\\n  --header "Authorization: Bearer <TWÓJ_TOKEN>"`;

const JSON_SNIPPET = `{
  "mcpServers": {
    "somalog": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <TWÓJ_TOKEN>"
      }
    }
  }
}`;

export default function DocsMcp() {
  return (
    <>
      {/* Przegląd */}
      <section id="przeglad" className="scroll-mt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ai">Serwer MCP SomaLog</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-txt">Dokumentacja MCP</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-txt-2">
          Serwer MCP (Model Context Protocol) udostępnia to samo API SomaLog jako gotowe narzędzia dla agentów AI —
          bez ręcznego składania zapytań HTTP. Klient MCP łączy się przez transport Streamable HTTP, a autoryzacja
          działa tym samym osobistym tokenem co REST API (nagłówek <code className="font-mono text-txt">Authorization: Bearer</code>).
        </p>
        <div className="mt-5">
          <SubHeading>URL serwera</SubHeading>
          <div className="mt-2">
            <CodeBlock code={MCP_URL} />
          </div>
        </div>
      </section>

      {/* Konfiguracja */}
      <section id="konfiguracja" className="scroll-mt-24 pt-14">
        <h2 className="font-display text-2xl font-semibold text-txt">Konfiguracja</h2>
        <div className="mt-4 space-y-5 text-[14px] leading-relaxed text-txt-2">
          <p>
            Wygeneruj osobisty token przyciskiem <span className="text-txt">„Generuj token"</span> na górze tej strony,
            a następnie dodaj serwer do swojego klienta MCP, podstawiając token w nagłówku.
          </p>
          <div>
            <SubHeading>Claude Code (CLI)</SubHeading>
            <div className="mt-2">
              <CodeBlock label="terminal" code={CLI_SNIPPET} />
            </div>
          </div>
          <div>
            <SubHeading>Cursor / Claude Desktop (mcp.json)</SubHeading>
            <div className="mt-2">
              <CodeBlock label="mcp.json" code={JSON_SNIPPET} />
            </div>
          </div>
          <p className="text-txt-3 text-[13px]">
            Transport: Streamable HTTP (bezstanowy). Token jest przekazywany dalej do API SomaLog, które waliduje go
            i izoluje dane do Twojego konta.
          </p>
        </div>
      </section>

      {/* create_entry */}
      <div className="pt-14">
        <Endpoint id="create_entry" badge={<ToolBadge />} signature="create_entry" title="create_entry">
          <p>
            Dodaje wpis SomaLog na dany dzień lub scala z istniejącym (aktualizuje tylko podane pola). Domyślnie dziś
            (strefa Europe/Warsaw). Trzeba podać co najmniej jeden parametr lub notatkę.
          </p>
          <div>
            <SubHeading>Parametry</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: 'date', type: 'string', desc: 'Dzień YYYY-MM-DD. Domyślnie dziś.', required: false },
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
        </Endpoint>
      </div>

      {/* ask_logan */}
      <div className="pt-14">
        <Endpoint id="ask_logan" badge={<ToolBadge />} signature="ask_logan" title="ask_logan">
          <p>
            Zadaje pytanie trenerowi regeneracji „Logan” i zwraca jego odpowiedź. Bezstanowe. Opcjonalny dzień jest
            użyty jako kontekst (domyślnie dziś).
          </p>
          <p>
            <span className="text-txt">Limit zapytań:</span> narzędzie korzysta z tego samego dziennego limitu co REST
            {' '}<code className="font-mono text-txt">/ask</code> — <span className="text-txt">100 zapytań na dobę per konto</span>
            {' '}(reset o północy, Europe/Warsaw). Po przekroczeniu narzędzie zwraca wynik z błędem (odpowiedź
            {' '}<code className="font-mono text-txt">429</code> z REST API).
          </p>
          <div>
            <SubHeading>Parametry</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: 'question', type: 'string', desc: 'Pytanie do Logana.', required: true },
                  { name: 'date', type: 'string', desc: 'Dzień kontekstu YYYY-MM-DD. Domyślnie dziś.', required: false },
                ]}
              />
            </div>
          </div>
        </Endpoint>
      </div>

      {/* get_entry */}
      <div className="pt-14 pb-24">
        <Endpoint id="get_entry" badge={<ToolBadge />} signature="get_entry" title="get_entry">
          <p>
            Zwraca wpis SomaLog na wskazany dzień (domyślnie dziś) lub informację o braku wpisu.
          </p>
          <div>
            <SubHeading>Parametry</SubHeading>
            <div className="mt-2">
              <ParamTable
                rows={[
                  { name: 'date', type: 'string', desc: 'Dzień YYYY-MM-DD. Domyślnie dziś.', required: false },
                ]}
              />
            </div>
          </div>
        </Endpoint>
      </div>
    </>
  );
}
