import {
  RecoveryIcon, TrainingIcon, SleepIcon, NutritionIcon, SupplementIcon, WearableIcon, AiIcon,
} from './icons';

const MODULES = [
  { Icon: RecoveryIcon,   name: 'Recovery',    active: true },
  { Icon: TrainingIcon,   name: 'Trening' },
  { Icon: SleepIcon,      name: 'Sen' },
  { Icon: NutritionIcon,  name: 'Dieta' },
  { Icon: SupplementIcon, name: 'Suplementy' },
  { Icon: WearableIcon,   name: 'Wearables' },
  { Icon: AiIcon,         name: 'AI Insight' },
];

function CollapseIcon({ dir = 'left' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

// Kwadracik ikony modułu — identyczny w stanie zwiniętym i rozwiniętym, więc przy
// animacji szerokości ikony nie „skaczą" (zmieniają się tylko etykiety po prawej).
function IconBox({ Icon, active }) {
  if (active) {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-recovery border border-recovery/40 bg-recovery/10 shrink-0">
        <Icon size={18} />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-elevated border border-dashed border-border flex items-center justify-center text-txt-3 shrink-0">
      <Icon size={18} />
    </div>
  );
}

// Etykieta modułu po prawej stronie ikony — pojawia się (opacity) przy rozwijaniu.
function Label({ name, active, open }) {
  return (
    <div className={`min-w-0 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
      {active ? (
        <>
          <p className="text-txt text-sm font-semibold leading-tight whitespace-nowrap">{name}</p>
          <p className="text-recovery text-[11px] leading-tight whitespace-nowrap">Aktywny</p>
        </>
      ) : (
        <>
          <p className="text-txt-2 text-sm leading-tight whitespace-nowrap">{name}</p>
          <p className="text-txt-3 text-[10px] leading-tight whitespace-nowrap">Wkrótce</p>
        </>
      )}
    </div>
  );
}

// Wspólna treść panelu: nagłówek (strzałka + tytuł) + wiersze modułów.
// Ikony zawsze w tej samej kolumnie (pl-[14px]), więc w stanie zwiniętym (w-16)
// widać tylko je, a rozwijanie odsłania etykiety bez przeskoku ikon.
function PanelBody({ open, onToggle }) {
  return (
    <div className="flex flex-col gap-2 py-3 w-64">
      {/* Nagłówek: strzałka zwiń/rozwiń w tej samej kolumnie co ikony */}
      <div className="flex items-center gap-3 pl-[14px] pr-2 h-9">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
          aria-label={open ? 'Zwiń panel' : 'Rozwiń panel'}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-3 hover:text-txt hover:bg-surface transition-colors shrink-0"
        >
          <CollapseIcon dir={open ? 'left' : 'right'} />
        </button>
        <p className={`text-txt-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
          Moduły
        </p>
      </div>

      {MODULES.map(m => (
        <div
          key={m.name}
          title={m.active ? undefined : `${m.name} — wkrótce`}
          className={`flex items-center gap-3 pl-[14px] pr-2 h-9 ${m.active ? '' : 'select-none'}`}
        >
          <IconBox Icon={m.Icon} active={m.active} />
          <Label name={m.name} active={m.active} open={open} />
        </div>
      ))}
    </div>
  );
}

/**
 * Panel modułów SomaLog. Recovery aktywny (podświetlony), reszta wyszarzona „wkrótce".
 * variant="sidebar" → desktop: jeden panel-nakładka, którego SZEROKOŚĆ animuje się
 *   płynnie 64↔256 px; ikony stoją w miejscu, etykiety wjeżdżają (opacity). Klik w dowolne
 *   miejsce zwiniętego panelu rozwija go. Rozwinięcie nie przesuwa treści (overlay).
 * variant="drawer" → mobile: off-canvas z nazwami; rail (zwinięty) klikalny w całości.
 */
export default function ModulesPanel({ variant, open, onToggle }) {
  if (variant === 'sidebar') {
    // Lewa kolumna obecna na każdej szerokości (w-16), więc panel zawsze jest po lewej.
    return (
      <aside className="relative shrink-0 w-16 border-r border-divider">
        {/* Desktop: nakładka o animowanej szerokości. Klik w dowolne miejsce panelu
            przełącza stan (rozwiń, gdy zwinięty; zwiń, gdy rozwinięty). */}
        <div
          onClick={() => onToggle?.()}
          className={`hidden md:block absolute top-0 left-0 h-full bg-bg border-r border-divider overflow-hidden z-30 cursor-pointer transition-[width] duration-300 ease-out ${
            open ? 'w-64 shadow-2xl' : 'w-16 hover:bg-surface/40'
          }`}
        >
          <PanelBody open={open} onToggle={onToggle} />
        </div>

        {/* Mobile: rail zwinięty (klik w całości otwiera drawer). */}
        <button
          type="button"
          onClick={onToggle}
          aria-label="Rozwiń panel modułów"
          className="md:hidden w-full flex flex-col gap-2 py-3 items-stretch"
        >
          <div className="flex items-center gap-3 pl-[14px] pr-2 h-9">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-3 shrink-0">
              <CollapseIcon dir="right" />
            </span>
          </div>
          {MODULES.map(m => (
            <div key={m.name} className="flex items-center gap-3 pl-[14px] pr-2 h-9">
              <IconBox Icon={m.Icon} active={m.active} />
            </div>
          ))}
        </button>
      </aside>
    );
  }

  // drawer (mobile): tylko elementy fixed (backdrop + off-canvas) — kolejność w DOM bez znaczenia.
  return (
    <>
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 bg-bg border-r border-divider overflow-y-auto transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <PanelBody open onToggle={onToggle} />
      </aside>
    </>
  );
}
