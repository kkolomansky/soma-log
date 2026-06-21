/**
 * Suwak dopasowany do UI: ciemny i subtelny (monochromatyczny).
 * Wypełnienie to stonowany szary, uchwyt jasnoszary (kształt z globalnego CSS — index.css).
 */
const FILL = '#52525b';
const TRACK = '#2a2a2a';

export default function Slider({ value, onChange, min = 0, max = 100, className = '' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className={className}
      style={{
        background: `linear-gradient(to right, ${FILL} 0%, ${FILL} ${pct}%, ${TRACK} ${pct}%, ${TRACK} 100%)`,
      }}
    />
  );
}
