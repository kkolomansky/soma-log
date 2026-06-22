/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    'ring-green-500', 'bg-green-500/10',
    'ring-yellow-500', 'bg-yellow-500/10',
    'ring-red-500', 'bg-red-500/10',
  ],
  theme: {
    extend: {
      colors: {
        // Powierzchnie / struktura (dark biometric OS)
        bg: '#0B0F0E',
        surface: '#151A18',
        elevated: '#1C2320',
        border: '#2A332F',
        divider: '#1C2320',
        'border-strong': '#3A453F',
        // Tekst
        txt: '#F4F4F5',
        'txt-2': '#A1A1AA',
        'txt-3': '#71717A',
        // Akcenty funkcjonalne
        recovery: '#22C55E',
        sleep: '#818CF8',
        energy: '#F59E0B',
        doms: '#F97316',
        danger: '#EF4444',
        ai: '#A855F7',
        cyan: '#22D3EE',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
