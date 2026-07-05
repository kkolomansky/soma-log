// Znak marki Soma.Log: pełny zielony pierścień z białą linią pulsu (EKG) w środku.
// `thinking` → animacja EKG (rysowanie linii + puls pierścienia) jako wskaźnik „agent myśli".
export function LogoMark({ size = 36, className = '', style, thinking = false }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pierścień */}
      <circle
        cx="32" cy="32" r="25"
        stroke="#22C55E" strokeWidth="4"
        className={thinking ? 'ekg-ring' : undefined}
      />
      {/* Puls — pozioma linia bazowa z jednym wyraźnym skokiem */}
      <polyline
        points="13,32 22,32 26,22 32,43 38,24 42,32 51,32"
        stroke="#F4F4F5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
        className={thinking ? 'ekg-draw' : undefined}
      />
    </svg>
  );
}

// Pełne logo: znak + wordmark „Soma.Log" + opcjonalny tagline.
// Znak ma wielkość = wysokość bloku tekstu (wordmark + podpis), liczoną z `size`.
// `centered` → wordmark wyśrodkowany w kontenerze, a znak wystaje absolutnie w lewo
// (używane na ekranie logowania, by „Soma.Log" i nagłówek były na jednej osi).
export function LogoFull({ size = 40, withTagline = false, className = '', centered = false }) {
  const wordmarkPx = size * 0.62;
  const taglinePx = size * 0.22;
  // Wysokość bloku tekstu (leading-none → line-height ≈ 1em); znak = tyle samo.
  const markSize = Math.round(withTagline ? wordmarkPx + 4 + taglinePx : wordmarkPx * 1.1);

  const textBlock = (
    <div className={`flex flex-col justify-center leading-none ${centered ? 'items-center' : ''}`}>
      <span className="font-display font-bold tracking-tight text-txt" style={{ fontSize: wordmarkPx }}>
        Soma<span className="text-recovery">.</span>Log
      </span>
      {withTagline && (
        <p className="font-mono text-txt-3 tracking-[0.18em] uppercase mt-1" style={{ fontSize: taglinePx }}>
          Body Operational System
        </p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className={`relative inline-flex ${className}`}>
        <span className="absolute top-1/2 -translate-y-1/2" style={{ right: 'calc(100% + 0.625rem)' }}>
          <LogoMark size={markSize} className="shrink-0" />
        </span>
        {textBlock}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} className="shrink-0" />
      {textBlock}
    </div>
  );
}
