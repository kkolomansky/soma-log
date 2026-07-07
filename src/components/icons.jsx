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

// Wyloguj — drzwi ze strzałką
export function LogoutIcon(props) {
  return (
    <Svg {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}

// Profil użytkownika — sylwetka
export function UserIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

// Głos / odczyt — głośnik z falami
export function SpeakerIcon(props) {
  return (
    <Svg {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </Svg>
  );
}

// Odśwież — kołowe strzałki
export function RefreshIcon(props) {
  return (
    <Svg {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </Svg>
  );
}

// Stop — kwadrat (zatrzymanie odtwarzania głosu)
export function StopIcon(props) {
  return <Svg {...props}><rect x="6" y="6" width="12" height="12" rx="2" /></Svg>;
}

// Notatka — kartka z liniami i zagiętym rogiem
export function NoteIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v5h5" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </Svg>
  );
}

// Zdjęcie + — ramka obrazka z plusem (dodawanie zdjęcia do wpisu)
export function PhotoPlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M19 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M3 16l4-4 4 4 3-3 3 3" />
      <path d="M18 3v6M15 6h6" />
    </Svg>
  );
}

// Token / API — klucz
export function KeyIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3 21 2" />
      <path d="M17 6l3 3" />
      <path d="M15 8l2 2" />
    </Svg>
  );
}

// E-mail — koperta
export function MailIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5 12 12l8.5-5.5" />
    </Svg>
  );
}

// Hasło — kłódka
export function LockIcon(props) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="11" width="15" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

// Wielkość czcionki — „Aa"
export function TextSizeIcon(props) {
  return (
    <Svg {...props}>
      <path d="M3 18 7 7l4 11M4.2 14.5h5.6" />
      <path d="M14 18l3-8 3 8M14.9 15.4h4.2" />
    </Svg>
  );
}

// Usunięcie — kosz
export function TrashIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
  );
}

// Google „G" — wielokolorowe logo marki (nie currentColor).
export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Dokumentacja — otwarta książka
export function DocsIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 6.5C10.5 5 8.5 4.5 4 5v13c4.5-.5 6.5 0 8 1.5" />
      <path d="M12 6.5C13.5 5 15.5 4.5 20 5v13c-4.5-.5-6.5 0-8 1.5" />
    </Svg>
  );
}
