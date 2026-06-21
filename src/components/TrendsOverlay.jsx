import Trends from '../screens/Trends';

export default function TrendsOverlay({ open, onClose, entries }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 z-50 bg-[#111111] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        } ${!open ? 'pointer-events-none' : ''}`}
      >
        <div className="flex items-center justify-between px-4 pt-8 pb-4 border-b border-[#1e1e1e] shrink-0">
          <h2 className="text-xl font-bold text-white">Historia</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Trends entries={entries} />
        </div>
      </div>
    </>
  );
}
