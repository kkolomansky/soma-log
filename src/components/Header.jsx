export default function Header({ onTrendsClick, onSignOut }) {
  return (
    <header className="px-4 pt-6 pb-3 border-b border-[#1e1e1e] flex items-start justify-between gap-3 shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">SomaLog</h1>
        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
          Śledzenie subiektywnego samopoczucia i regeneracji
        </p>
      </div>
      <div className="flex items-center gap-1 pt-1">
        <button
          onClick={onTrendsClick}
          title="Historia"
          className="p-2 rounded-xl hover:bg-[#1c1c1e] transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" stroke="#6b7280">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </button>
        <button
          onClick={onSignOut}
          className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded-lg hover:bg-[#1c1c1e] transition-colors"
        >
          wyloguj
        </button>
      </div>
    </header>
  );
}
