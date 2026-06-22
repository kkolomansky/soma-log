import ModulesPanel from '../components/ModulesPanel';

export default function AppLayout({ header, dayStrip, dayView, inputBar, modals, modulesOpen, onToggleModules }) {
  return (
    <div className="flex h-screen bg-bg">
      {/* Lewy panel modułów — rozwijalny sidebar na desktopie */}
      <ModulesPanel variant="sidebar" open={modulesOpen} onToggle={onToggleModules} />

      {/* Główna kolumna */}
      <div className="flex-1 flex flex-col min-w-0">
        {header}
        {dayStrip}
        <div className="flex-1 overflow-y-auto">
          {dayView}
        </div>
        {inputBar}
      </div>

      {/* Panel modułów jako drawer na mobile */}
      <ModulesPanel variant="drawer" open={modulesOpen} onToggle={onToggleModules} />

      {modals}
    </div>
  );
}
