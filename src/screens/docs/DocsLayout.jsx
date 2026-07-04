import { LogoFull } from '../../components/Logo';
import { navigate } from '../../lib/nav';
import { Sidebar, useScrollspy } from './ui';
import TokenGenerator from './TokenGenerator';

// Przełącznik segmentowy API | MCP (wspólny górny pasek).
function Switcher({ active }) {
  const tab = (id, label, to) => {
    const on = active === id;
    return (
      <button
        onClick={() => navigate(to)}
        className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
          on ? 'bg-elevated text-txt shadow-sm' : 'text-txt-3 hover:text-txt'
        }`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      {tab('api', 'API', '/docs')}
      {tab('mcp', 'MCP', '/docs/mcp')}
    </div>
  );
}

// Wspólna powłoka obu podstron docs: górny pasek (logo, przełącznik, generator tokenu),
// spójny pasek boczny (nav) i obszar treści. `active` = 'api' | 'mcp'.
export default function DocsLayout({ active, nav, session, children }) {
  const ids = nav.flatMap((g) => g.items.map((i) => i.id));
  const basePath = active === 'mcp' ? '/docs/mcp' : '/docs';
  const { active: activeId, go } = useScrollspy(ids, basePath);

  return (
    <div className="min-h-screen bg-bg text-txt">
      {/* Wspólny górny pasek */}
      <header className="sticky top-0 z-30 border-b border-divider bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => navigate('/')} className="flex items-center shrink-0" aria-label="Strona główna">
              <LogoFull size={34} />
            </button>
            <Switcher active={active} />
          </div>
          <div className="flex items-center gap-2.5">
            <TokenGenerator session={session} />
            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-txt-2 hover:text-txt hover:bg-elevated transition-colors"
            >
              ← Do aplikacji
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-5">
        <Sidebar nav={nav} active={activeId} go={go} />
        <main className="min-w-0 flex-1 py-8 max-w-3xl">{children}</main>
      </div>
    </div>
  );
}
