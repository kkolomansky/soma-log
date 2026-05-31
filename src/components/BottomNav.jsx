const NAV_ITEMS = [
  {
    key: 'add',
    label: 'Dodaj',
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#ffffff' : '#6b7280'}>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    key: 'log',
    label: 'Dziennik',
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#ffffff' : '#6b7280'}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    key: 'trends',
    label: 'Historia',
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#ffffff' : '#6b7280'}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav
      className="fixed bottom-0 bg-[#1c1c1e] border-t border-[#2a2a2a]"
      style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '28rem' }}
    >
      <div className="flex">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex-1 flex flex-col items-center py-3 gap-1"
          >
            {item.icon(current === item.key)}
            <span
              className="text-xs font-medium"
              style={{ color: current === item.key ? '#ffffff' : '#6b7280' }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
