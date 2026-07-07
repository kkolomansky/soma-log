// Pojedyncze zdjęcie w oryginalnej rozdzielczości, wyśrodkowane, z przyciskiem usunięcia (✕).
// src=null → placeholder (trwa pobieranie signed URL). onRemove=null → tylko podgląd.
// onOpen → klik w zdjęcie otwiera pełnoekranową galerię.
export default function PhotoFrame({ src, onRemove, onOpen }) {
  return (
    <div className="relative inline-block max-w-full">
      {src ? (
        <img
          src={src}
          alt=""
          onClick={onOpen}
          className={`max-w-full h-auto rounded-xl border border-border ${onOpen ? 'cursor-zoom-in' : ''}`}
        />
      ) : (
        <div className="w-40 h-40 rounded-xl border border-border bg-elevated animate-pulse" />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Usuń zdjęcie"
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white text-sm hover:bg-danger transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
