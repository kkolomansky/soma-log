import { LogoFull } from './Logo';
import { LogoutIcon, UserIcon, DocsIcon } from './icons';
import { navigate } from '../lib/nav';

export default function Header({ onSignOut, onOpenSettings }) {
  const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors';
  return (
    <header className="px-4 pt-6 pb-3 border-b border-divider flex items-center justify-between gap-3 shrink-0">
      <LogoFull size={40} withTagline />
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          title="Panel użytkownika"
          aria-label="Profil użytkownika"
          className={iconBtn}
        >
          <UserIcon size={20} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/docs')}
          title="Dokumentacja API"
          aria-label="Dokumentacja API"
          className={iconBtn}
        >
          <DocsIcon size={20} />
        </button>
        <button
          onClick={onSignOut}
          title="Wyloguj"
          aria-label="Wyloguj"
          className={iconBtn}
        >
          <LogoutIcon size={20} />
        </button>
      </div>
    </header>
  );
}
