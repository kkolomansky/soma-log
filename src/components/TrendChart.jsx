import { METRICS } from '../utils/metrics';

export default function TrendChart({ entries }) {
  if (!entries || entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const W = 360, H = 170;
  const padL = 26, padR = 10, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xPos = (i) =>
    padL + (sorted.length > 1 ? (i / (sorted.length - 1)) * chartW : chartW / 2);
  const yPos = (val) =>
    padT + chartH - (val / 100) * chartH;

  const makePath = (key) =>
    sorted
      .map((e, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(e[key]).toFixed(1)}`)
      .join(' ');

  const labelCount = Math.min(sorted.length, 5);
  const labelIndices =
    sorted.length <= 5
      ? sorted.map((_, i) => i)
      : Array.from({ length: labelCount }, (_, k) =>
          Math.round((k / (labelCount - 1)) * (sorted.length - 1))
        );

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* Horizontal grid lines + Y labels */}
        {[20, 40, 60, 80, 100].map(v => {
          const y = yPos(v);
          return (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#2A332F" strokeWidth="1" />
              <text x={padL - 5} y={y} textAnchor="end" dominantBaseline="middle"
                fill="#71717A" fontSize="9" fontFamily="'Geist Mono', monospace">{v}</text>
            </g>
          );
        })}

        {/* Metric lines + dots */}
        {METRICS.map(m => (
          <g key={m.key}>
            <path
              d={makePath(m.key)}
              fill="none"
              stroke={m.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {sorted.map((e, i) => (
              <circle
                key={i}
                cx={xPos(i).toFixed(1)}
                cy={yPos(e[m.key]).toFixed(1)}
                r="3.5"
                fill={m.color}
                stroke="#151A18"
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}

        {/* X axis date labels */}
        {labelIndices.map(i => (
          <text key={i} x={xPos(i).toFixed(1)} y={H - 4}
            textAnchor="middle" fill="#71717A" fontSize="9" fontFamily="'Geist Mono', monospace">
            {new Date(sorted[i].timestamp).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {METRICS.map(m => (
          <div key={m.key} className="flex items-center gap-1.5">
            <span style={{ color: m.color }}><m.Icon size={14} /></span>
            <span className="text-txt-2 text-xs">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
