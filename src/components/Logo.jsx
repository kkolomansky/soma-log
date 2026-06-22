// Znak marki Soma.Log: „S" w pierścieniu-zegarze (gauge) z zielonym łukiem regeneracji.
// viewBox ciasny (8..56), żeby pierścień wypełniał pole bez martwego marginesu.
export function LogoMark({ size = 36, className = '', style }) {
  return (
    <svg
      viewBox="8 8 48 48"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="20" stroke="#1C2320" strokeWidth="5" />
      <path d="M32 12 a20 20 0 0 1 14.14 34.14" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M38 25.5 C38 22.5 35.3 21 32 21 C28.7 21 26 22.5 26 25 C26 31 39 29 39 35.5 C39 38.5 36 40 32 40 C28.5 40 25.5 38.7 25 36"
        stroke="#F4F4F5"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Pełne logo: znak + wordmark „Soma.Log" + opcjonalny tagline.
// Znak ma wielkość = wysokość bloku tekstu (wordmark + podpis), liczoną z `size`.
export function LogoFull({ size = 40, withTagline = false, className = '' }) {
  const wordmarkPx = size * 0.62;
  const taglinePx = size * 0.22;
  // Wysokość bloku tekstu (leading-none → line-height ≈ 1em); znak = tyle samo.
  const markSize = Math.round(withTagline ? wordmarkPx + 4 + taglinePx : wordmarkPx * 1.1);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} className="shrink-0" />
      <div className="flex flex-col justify-center leading-none">
        <span className="font-display font-bold tracking-tight text-txt" style={{ fontSize: wordmarkPx }}>
          Soma<span className="text-recovery">.</span>Log
        </span>
        {withTagline && (
          <p className="font-mono text-txt-3 tracking-[0.18em] uppercase mt-1" style={{ fontSize: taglinePx }}>
            Body Operational System
          </p>
        )}
      </div>
    </div>
  );
}
