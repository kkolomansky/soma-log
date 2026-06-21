const FUTURE = [
  { icon: '🏋️', name: 'Trening' },
  { icon: '😴', name: 'Sen' },
  { icon: '🥗', name: 'Dieta' },
  { icon: '💊', name: 'Suplementy' },
  { icon: '⌚', name: 'Wearables' },
  { icon: '🤖', name: 'AI Insight' },
];

function CollapseIcon({ dir = 'left' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

// Wiersz modułu: kwadracik ikony (w-9, jak w railu) + nazwa po prawej.
function ModuleRow({ icon, name, active }) {
  if (active) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 border border-emerald-500/40 bg-emerald-500/10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">{name}</p>
          <p className="text-emerald-400 text-[11px] leading-tight">Aktywny</p>
        </div>
      </div>
    );
  }
  return (
    <div title={`${name} — wkrótce`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 opacity-50 cursor-not-allowed select-none">
      <div className="w-9 h-9 rounded-xl bg-[#161618] border border-dashed border-[#2a2a2a] flex items-center justify-center text-base grayscale shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-300 text-sm leading-tight">{name}</p>
        <p className="text-gray-600 text-[10px] leading-tight">Wkrótce</p>
      </div>
    </div>
  );
}

function PanelContent({ onToggle }) {
  return (
    <div className="flex flex-col gap-1 p-2 w-64">
      <div className="flex items-center justify-between h-9 pl-2 pr-1 mb-1">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Moduły</p>
        {onToggle && (
          <button onClick={onToggle} aria-label="Zwiń panel"
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1c1c1e] transition-colors">
            <CollapseIcon dir="left" />
          </button>
        )}
      </div>
      <ModuleRow icon="⚡" name="Recovery" active />
      {FUTURE.map(m => <ModuleRow key={m.name} icon={m.icon} name={m.name} />)}
    </div>
  );
}

function CollapsedRail({ onToggle }) {
  return (
    <div className="flex flex-col items-center gap-2 py-3 w-16">
      <button onClick={onToggle} aria-label="Rozwiń panel"
        className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-[#1c1c1e] transition-colors">
        <CollapseIcon dir="right" />
      </button>
      <div className="w-9 h-9 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-lg" title="Recovery (aktywny)">⚡</div>
      {FUTURE.map(m => (
        <div key={m.name} title={`${m.name} — wkrótce`}
          className="w-9 h-9 rounded-xl bg-[#161618] border border-dashed border-[#2a2a2a] flex items-center justify-center text-base opacity-45 grayscale cursor-not-allowed">
          {m.icon}
        </div>
      ))}
    </div>
  );
}

/**
 * Panel modułów SomaLog. Recovery aktywny (podświetlony), reszta wyszarzona „wkrótce".
 * variant="sidebar" → rail w-16 (zawsze) + nakładka z nazwami po rozwinięciu (desktop);
 * variant="drawer" → off-canvas z nazwami (mobile). Rozwinięcie nie przesuwa treści.
 */
export default function ModulesPanel({ variant, open, onToggle }) {
  if (variant === 'sidebar') {
    return (
      <aside className="block relative shrink-0 w-16 border-r border-[#1e1e1e]">
        {/* Rail z ikonami — zawsze, stała szerokość (mobile + desktop) */}
        <div className="h-full overflow-y-auto scrollbar-hide">
          <CollapsedRail onToggle={onToggle} />
        </div>
        {/* Desktop: nakładka z nazwami po rozwinięciu (mobile korzysta z drawera) */}
        <div
          className={`hidden md:block absolute top-0 left-0 h-full w-64 bg-[#111111] border-r border-[#1e1e1e] shadow-2xl overflow-y-auto scrollbar-hide z-30 transition-[transform,opacity] duration-200 ${
            open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0 pointer-events-none'
          }`}
        >
          <PanelContent onToggle={onToggle} />
        </div>
      </aside>
    );
  }

  // drawer (mobile)
  return (
    <>
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 bg-[#111111] border-r border-[#1e1e1e] overflow-y-auto transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <PanelContent onToggle={onToggle} />
      </aside>
    </>
  );
}
