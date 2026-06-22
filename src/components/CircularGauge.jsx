export default function CircularGauge({ value, max = 10, color, size = 80, strokeWidth = 7 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.round((value / max) * 100);
  const offset = circumference * (1 - percentage / 100);
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="#2A332F"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease', filter: `drop-shadow(0 0 ${strokeWidth * 0.5}px ${color}66)` }}
        />
      </svg>
      <span
        className="absolute font-mono font-semibold text-txt"
        style={{ fontSize: size * 0.2 }}
      >
        {percentage}%
      </span>
    </div>
  );
}
