export default function AppLayout({ header, dayStrip, dayStripVertical, dayView, inputBar, modals }) {
  return (
    <>
      {/* ── Mobile (< md) ── */}
      <div className="md:hidden flex flex-col h-screen bg-[#111111]">
        {header}
        <div className="border-b border-[#1e1e1e]">
          {dayStrip}
        </div>
        <div className="flex-1 overflow-y-auto">
          {dayView}
        </div>
        {inputBar}
      </div>

      {/* ── Desktop (≥ md) ── */}
      <div className="hidden md:flex h-screen bg-[#111111]">
        <aside className="w-72 flex flex-col border-r border-[#1e1e1e] shrink-0">
          {header}
          <div className="flex-1 overflow-y-auto">
            {dayStripVertical}
          </div>
        </aside>
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            {dayView}
          </div>
          {inputBar}
        </main>
      </div>

      {modals}
    </>
  );
}
