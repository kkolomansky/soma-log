import { useState, useEffect, useRef, useCallback } from 'react';

function Chevron({ dir, size = 26 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Pełnoekranowy podgląd galerii: zdjęcie w oryginalnej rozdzielczości, z powiększaniem
 * (przyciski +/−, podwójne kliknięcie, kółko myszy) i przewijaniem kolejnych zdjęć
 * w lewo/prawo (strzałki ekranowe, klawiatura, gest przesunięcia palcem/myszą przy zoom=1).
 */
export default function PhotoLightbox({ open, urls = [], index = 0, onIndexChange, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const swipeRef = useRef(null);
  const count = urls.length;

  const resetView = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);

  // Reset powiększenia przy każdej zmianie zdjęcia / otwarciu.
  useEffect(() => { resetView(); }, [index, open, resetView]);

  const go = useCallback((delta) => {
    if (count < 2) return;
    const next = (index + delta + count) % count;
    onIndexChange?.(next);
  }, [count, index, onIndexChange]);

  // Klawiatura: ←/→ nawigacja, +/− zoom, Esc zamknięcie.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Escape') onClose?.();
      else if (e.key === '+' || e.key === '=') setZoom(z => clamp(z + 0.5, MIN_ZOOM, MAX_ZOOM));
      else if (e.key === '-') setZoom(z => { const nz = clamp(z - 0.5, MIN_ZOOM, MAX_ZOOM); if (nz === 1) setOffset({ x: 0, y: 0 }); return nz; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose]);

  if (!open || count === 0) return null;

  const zoomIn = () => setZoom(z => clamp(z + 0.5, MIN_ZOOM, MAX_ZOOM));
  const zoomOut = () => setZoom(z => { const nz = clamp(z - 0.5, MIN_ZOOM, MAX_ZOOM); if (nz === 1) setOffset({ x: 0, y: 0 }); return nz; });

  const onWheel = (e) => {
    setZoom(z => {
      const nz = clamp(z - Math.sign(e.deltaY) * 0.35, MIN_ZOOM, MAX_ZOOM);
      if (nz === 1) setOffset({ x: 0, y: 0 });
      return nz;
    });
  };

  const onDoubleClick = () => {
    if (zoom > 1) resetView();
    else setZoom(2);
  };

  // Przeciąganie: przy zoom>1 → panorama zdjęcia; przy zoom=1 → gest zmiany zdjęcia.
  const onPointerDown = (e) => {
    if (zoom > 1) {
      dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } else {
      swipeRef.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  };
  const onPointerUp = (e) => {
    if (dragRef.current) { dragRef.current = null; return; }
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const btn = 'flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur';

  return (
    <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center select-none" onClick={onClose}>
      {/* Górny pasek: licznik + zamknij */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10" onClick={e => e.stopPropagation()}>
        <span className="text-white/80 text-sm font-mono tabular-nums">{index + 1} / {count}</span>
        <button onClick={onClose} aria-label="Zamknij" className={`${btn} w-10 h-10`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Obraz */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
        onClick={e => e.stopPropagation()}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current = null; swipeRef.current = null; }}
        style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
      >
        <img
          src={urls[index]}
          alt=""
          draggable={false}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: dragRef.current ? 'none' : 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* Strzałki nawigacji */}
      {count > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); go(-1); }} aria-label="Poprzednie zdjęcie"
            className={`${btn} absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11`}>
            <Chevron dir="left" />
          </button>
          <button onClick={e => { e.stopPropagation(); go(1); }} aria-label="Następne zdjęcie"
            className={`${btn} absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11`}>
            <Chevron dir="right" />
          </button>
        </>
      )}

      {/* Sterowanie powiększeniem */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Pomniejsz" className={`${btn} w-10 h-10 disabled:opacity-30`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <span className="text-white/80 text-xs font-mono tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Powiększ" className={`${btn} w-10 h-10 disabled:opacity-30`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>
    </div>
  );
}
