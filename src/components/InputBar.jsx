function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export default function InputBar({ onMicClick }) {
  return (
    <div className="shrink-0 bg-[#111111] border-t border-[#1e1e1e] px-4 py-3">
      <div className="flex items-center gap-3 bg-[#1c1c1e] rounded-2xl px-4 py-2.5">
        <input
          type="text"
          placeholder="Napisz lub nagraj..."
          className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
          readOnly
        />
        <button
          onClick={onMicClick}
          className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-[#333] active:scale-95 transition-all shrink-0"
        >
          <MicIcon />
        </button>
      </div>
    </div>
  );
}
