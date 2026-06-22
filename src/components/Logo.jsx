// Znak marki Soma.Log: „S" w pierścieniu-zegarze (gauge) z zielonym łukiem regeneracji.
export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
export function LogoFull({ size = 36, withTagline = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <div className="leading-none">
        <span className="font-display font-bold tracking-tight text-txt" style={{ fontSize: size * 0.62 }}>
          Soma<span className="text-recovery">.</span>Log
        </span>
        {withTagline && (
          <p className="font-mono text-txt-3 tracking-[0.18em] uppercase mt-1" style={{ fontSize: size * 0.22 }}>
            Dark Biometric OS
          </p>
        )}
      </div>
    </div>
  );
}
