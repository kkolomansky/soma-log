/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    'ring-green-500', 'bg-green-500/10',
    'ring-yellow-500', 'bg-yellow-500/10',
    'ring-red-500', 'bg-red-500/10',
  ],
  theme: { extend: {} },
  plugins: [],
};
