import { LogoFull } from './Logo';

export default function Header({ onSignOut }) {
  return (
    <header className="px-4 pt-6 pb-3 border-b border-divider flex items-center justify-between gap-3 shrink-0">
      <LogoFull size={34} withTagline />
      <button
        onClick={onSignOut}
        className="text-txt-3 hover:text-txt-2 text-xs px-2 py-1 rounded-lg hover:bg-surface transition-colors"
      >
        wyloguj
      </button>
    </header>
  );
}
