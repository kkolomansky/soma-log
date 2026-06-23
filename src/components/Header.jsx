import { LogoFull } from './Logo';
import { LogoutIcon, UserIcon } from './icons';

export default function Header({ onSignOut }) {
  const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors';
  return (
    <header className="px-4 pt-6 pb-3 border-b border-divider flex items-center justify-between gap-3 shrink-0">
      <LogoFull size={40} withTagline />
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          title="Panel użytkownika — wkrótce"
          aria-label="Profil użytkownika"
          className={iconBtn}
        >
          <UserIcon size={20} />
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
