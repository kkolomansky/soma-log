import { METRICS } from '../utils/metrics';
import { dateStrToMs } from '../utils/trendAxis';

export default function TrendChart({ entries, startMs, endMs, ticks }) {
  if (!entries || entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => dateStrToMs(a.entryDate) - dateStrToMs(b.entryDate));

  const W = 360, H = 170;
  const padL = 26, padR = 10, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const span = Math.max(1, endMs - startMs);
  const xPos = (ms) => padL + ((ms - startMs) / span) * chartW;
  const yPos = (val) => padT + chartH - (val / 100) * chartH;

  const makePath = (key) =>
    sorted
      .map((e, i) => `${i === 0 ? 'M' : 'L'} ${xPos(dateStrToMs(e.entryDate)).toFixed(1)} ${yPos(e[key]).toFixed(1)}`)
      .join(' ');

  // Linie 30% cieńsze; znaczniki znacznie mniejsze i malejące z gęstością wpisów,
  // aż do ukrycia przy bardzo dużej liczbie punktów (czytelność „Wszystko").
  const LINE_W = 1.0;                 // było 1.4 → −30%
  const n = sorted.length;
  const dotR = n > 90 ? 0 : n > 45 ? 1.1 : 1.5;
  const dotStroke = 0.5;

  // Etykiety osi (30% mniejsze niż dotychczas).
  const AXIS_FONT = 6.3;
  // Anty-nakładanie etykiet X: priorytet dla skrajnych (pierwsza/dziś), reszta tylko gdy się mieści.
  const halfW = (label) => (label.length * AXIS_FONT * 0.6) / 2 + 2;
  const ordered = ticks.map(t => ({ ...t, x: xPos(t.ms) }));
  const priority = ordered.length > 1
    ? [ordered[0], ordered[ordered.length - 1], ...ordered.slice(1, -1)]
    : ordered;
  const placed = [];
  for (const t of priority) {
    const hw = halfW(t.label);
    if (placed.every(p => Math.abs(p.x - t.x) >= hw + p.hw)) placed.push({ ...t, hw });
  }
  const xLabels = placed.sort((a, b) => a.x - b.x);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* Linie poziome + etykiety Y — stała skala 0–100 */}
        {[0, 20, 40, 60, 80, 100].map(v => {
          const y = yPos(v);
          return (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#2A332F" strokeWidth="1" />
              <text x={padL - 5} y={y} textAnchor="end" dominantBaseline="middle"
                fill="#71717A" fontSize={AXIS_FONT} fontFamily="'Geist Mono', monospace">{v}</text>
            </g>
          );
        })}

        {/* Linie metryk + punkty (pozycja X wg entryDate) */}
        {METRICS.map(m => (
          <g key={m.key}>
            <path
              d={makePath(m.key)}
              fill="none"
              stroke={m.color}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {dotR > 0 && sorted.map((e, i) => (
              <circle
                key={i}
                cx={xPos(dateStrToMs(e.entryDate)).toFixed(1)}
                cy={yPos(e[m.key]).toFixed(1)}
                r={dotR}
                fill={m.color}
                stroke="#151A18"
                strokeWidth={dotStroke}
              />
            ))}
          </g>
        ))}

        {/* Etykiety osi X — odfiltrowane tak, by się nie nakładały */}
        {xLabels.map((t, i) => (
          <text key={i} x={t.x.toFixed(1)} y={H - 4}
            textAnchor="middle" fill="#71717A" fontSize={AXIS_FONT} fontFamily="'Geist Mono', monospace">
            {t.label}
          </text>
        ))}
      </svg>

      {/* Legenda — układ 1:1 jak parametry w zakładce Wskaźniki:
          siatka 3 kolumn, ikona + opis wyśrodkowane w każdej komórce.
          Kolejność: Stres w górnym rzędzie, Motywacja w dolnym (tylko legenda trendów). */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {['sleep', 'energy', 'stress', 'fatigue', 'doms', 'motivation']
          .map(k => METRICS.find(m => m.key === k))
          .map(m => (
          <div key={m.key} className="flex items-center justify-center gap-1 min-w-0">
            <span className="shrink-0" style={{ color: m.color }}><m.Icon size={14} /></span>
            <span className="text-txt-2 text-xs font-medium leading-tight truncate">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
