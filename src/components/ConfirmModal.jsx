// Uniwersalny modal potwierdzenia — ten sam ciemny design co reszta aplikacji.
// Używany do usuwania wpisu i usuwania pojedynczego zdjęcia.
export default function ConfirmModal({ open, title, message = null, confirmLabel = 'Usuń', onCancel, onConfirm }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
      />
      <div className={`fixed inset-0 z-[70] flex items-center justify-center px-6 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`w-full max-w-xs bg-elevated border border-border rounded-2xl p-5 transition-[transform,opacity] duration-200 ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <p className="text-txt font-display font-semibold text-base text-center">{title}</p>
          {message && <p className="text-txt-3 text-sm text-center mt-1.5">{message}</p>}
          <div className="flex gap-2 mt-5">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-txt-2 hover:bg-surface transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white hover:opacity-90 transition-opacity"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
