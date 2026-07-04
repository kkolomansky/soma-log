import { useState, useEffect, useRef, useCallback } from 'react';

// Współdzielone prymitywy dokumentacji (API + MCP) — spójny styl w duchu docs Vercela.

export function MethodBadge({ method }) {
  const color = method === 'GET' ? 'text-recovery bg-recovery/10' : 'text-sleep bg-sleep/10';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${color}`}>
      {method}
    </span>
  );
}

// Pill dla narzędzia MCP (spójny z MethodBadge, inny akcent).
export function ToolBadge({ children = 'TOOL' }) {
  return (
    <span className="inline-flex items-center rounded-md bg-ai/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-ai">
      {children}
    </span>
  );
}

export function CodeBlock({ code, label }) {
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

// Tabela parametrów — kolumny: parametr / typ / opis.
export function ParamTable({ rows }) {
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

// Blok endpointu/narzędzia — nagłówek + „sygnatura” (badge + ścieżka/nazwa) + treść.
export function Endpoint({ id, badge, signature, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-2">
      <h2 className="font-display text-2xl font-semibold text-txt">{title}</h2>
      <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
        {badge}
        <code className="font-mono text-[13px] text-txt-2 break-all">{signature}</code>
      </div>
      <div className="mt-5 space-y-5 text-[14px] leading-relaxed text-txt-2">{children}</div>
    </section>
  );
}

export function SubHeading({ children }) {
  return <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-txt-3">{children}</h3>;
}

// Scrollspy — zwraca aktywną sekcję i handler nawigacji kotwiczącej. `basePath` np. '/docs' albo '/docs/mcp'.
export function useScrollspy(ids, basePath) {
  const [active, setActive] = useState(ids[0]);
  const clickLock = useRef(0);

  // Reset przy zmianie zestawu sekcji (przełączenie API↔MCP).
  useEffect(() => { setActive(ids[0]); }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

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
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((id) => (e) => {
    e.preventDefault();
    setActive(id);
    clickLock.current = Date.now() + 700; // chwilowo blokuj scrollspy, by klik był stabilny
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState({}, '', `${basePath}#${id}`);
  }, [basePath]);

  return { active, go };
}

// Lewa kolumna nawigacji — spójna dla obu podstron; różni się tylko danymi `nav`.
export function Sidebar({ nav, active, go }) {
  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="sticky top-20 py-8 space-y-6">
        {nav.map((group) => (
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
  );
}

export function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('pl-PL'); } catch { return '—'; }
}
