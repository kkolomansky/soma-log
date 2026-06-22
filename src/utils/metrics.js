import {
  SleepIcon, EnergyIcon, MotivationIcon, FatigueIcon, SorenessIcon, StressIcon,
} from '../components/icons';

// Jedno źródło prawdy dla 6 parametrów dnia (skala 0–100).
// higherBetter=false → parametr odwracany (100 - v) w wyniku ogólnym regeneracji.
// Icon → liniowy komponent SVG (kolor dziedziczony przez currentColor).
export const METRICS = [
  { key: 'sleep',      label: 'Sen',       Icon: SleepIcon,      color: '#818CF8', higherBetter: true,  default: 50 },
  { key: 'energy',     label: 'Energia',   Icon: EnergyIcon,     color: '#F59E0B', higherBetter: true,  default: 50 },
  { key: 'motivation', label: 'Motywacja', Icon: MotivationIcon, color: '#22C55E', higherBetter: true,  default: 50 },
  { key: 'fatigue',    label: 'Zmęczenie', Icon: FatigueIcon,    color: '#F97316', higherBetter: false, default: 50 },
  { key: 'doms',       label: 'Bolesność', Icon: SorenessIcon,   color: '#EF4444', higherBetter: false, default: 50 },
  { key: 'stress',     label: 'Stres',     Icon: StressIcon,     color: '#A855F7', higherBetter: false, default: 50 },
];

// Wartości domyślne dla nowego wpisu, np. { sleep: 50, energy: 50, ... }.
export const METRIC_DEFAULTS = Object.fromEntries(METRICS.map(m => [m.key, m.default]));
