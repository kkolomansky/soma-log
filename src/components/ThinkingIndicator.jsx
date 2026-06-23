import { LogoMark } from './Logo';

// Miniatura EKG z logotypu, animowana — sygnalizuje, że agent przetwarza odpowiedź.
export default function ThinkingIndicator({ size = 28, label = 'Analizuję…', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-txt-3 text-sm ${className}`}>
      <LogoMark size={size} thinking className="shrink-0" />
      {label && <span className="leading-none">{label}</span>}
    </span>
  );
}
