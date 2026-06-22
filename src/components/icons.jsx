// Liniowy system ikon Soma.Log — 24×24, stroke=currentColor, fill=none.
// Spójny styl: strokeWidth 1.8, zaokrąglone końce/łączenia.
function Svg({ size = 20, children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── Metryki ─────────────────────────────────────────── */

// Sen — księżyc
export function SleepIcon(props) {
  return <Svg {...props}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" /></Svg>;
}

// Energia — błyskawica
export function EnergyIcon(props) {
  return <Svg {...props}><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" /></Svg>;
}

// Motywacja — cel / tarcza
export function MotivationIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </Svg>
  );
}

// Zmęczenie — bateria (niski poziom)
export function FatigueIcon(props) {
  return (
    <Svg {...props}>
      <rect x="2" y="8" width="16" height="9" rx="2.2" />
      <line x1="21.5" y1="11" x2="21.5" y2="14" />
      <line x1="5.5" y1="11" x2="5.5" y2="14" />
    </Svg>
  );
}

// Bolesność (DOMS) — kropla
export function SorenessIcon(props) {
  return <Svg {...props}><path d="M12 2.5s6.5 6.4 6.5 11a6.5 6.5 0 0 1-13 0c0-4.6 6.5-11 6.5-11z" /></Svg>;
}

// Stres — fala / sygnał
export function StressIcon(props) {
  return <Svg {...props}><path d="M2 12h4l2.5-7 4 16 2.5-9H22" /></Svg>;
}

/* ── Moduły ──────────────────────────────────────────── */

// Trening — hantla
export function TrainingIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </Svg>
  );
}

// Dieta — widelec + nóż
export function NutritionIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6 2v7a2 2 0 0 0 4 0V2M8 9v13" />
      <path d="M17 2c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4S18.5 2 17 2zM17 11v11" />
    </Svg>
  );
}

// Suplementy — pigułka
export function SupplementIcon(props) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </Svg>
  );
}

// Wearables — zegarek
export function WearableIcon(props) {
  return (
    <Svg {...props}>
      <rect x="7" y="7" width="10" height="10" rx="2.5" />
      <path d="M9 7l.6-3.2A1.5 1.5 0 0 1 11 2.5h2a1.5 1.5 0 0 1 1.4 1.3L15 7M9 17l.6 3.2A1.5 1.5 0 0 0 11 21.5h2a1.5 1.5 0 0 0 1.4-1.3L15 17" />
    </Svg>
  );
}

// AI Insight — procesor / chip
export function AiIcon(props) {
  return (
    <Svg {...props}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3" />
    </Svg>
  );
}

// Recovery — serce (moduł aktywny)
export function RecoveryIcon(props) {
  return <Svg {...props}><path d="M12 20.5 4.2 12.7a5 5 0 1 1 7.1-7.1l.7.7.7-.7a5 5 0 1 1 7.1 7.1z" /></Svg>;
}

/* ── UI / sekcje ─────────────────────────────────────── */

// Wskaźniki — tarcza zegara/gauge
export function GaugeIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 13a9 9 0 0 1 18 0" />
      <path d="M12 13l4-2.5" />
      <circle cx="12" cy="13" r="1.2" />
    </Svg>
  );
}

// Trendy — wykres aktywności (jak dawniej w nagłówku)
export function TrendsIcon(props) {
  return <Svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Svg>;
}
