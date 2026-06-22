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

export default function InputBar() {
  // Pasek transkrypcji — placeholder. Logika rozpoznawania mowy w kolejnym kroku.
  return (
    <div className="shrink-0 bg-bg border-t border-divider px-4 py-3">
      <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-2.5 opacity-60">
        <input
          type="text"
          placeholder="Transkrypcja głosowa — wkrótce"
          className="flex-1 bg-transparent text-txt placeholder-txt-3 text-sm outline-none cursor-not-allowed"
          readOnly
        />
        <button
          type="button"
          disabled
          title="Transkrypcja głosowa — wkrótce"
          aria-label="Transkrypcja — wkrótce"
          className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center shrink-0 cursor-not-allowed"
        >
          <MicIcon />
        </button>
      </div>
    </div>
  );
}
