export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { navy: '#163A63', 'navy-dark': '#102A43', gold: '#D6B25E', 'blue-light': '#EDF4FA', 'gray-light': '#F5F7FA', ink: '#243447', muted: '#667085' },
    fontFamily: { sans: ['"Noto Sans Thai"', 'system-ui', 'sans-serif'], serif: ['"Noto Serif Thai"', '"Noto Sans Thai"', 'serif'] },
    // Thai needs taller line boxes than Tailwind's Latin defaults, or tone marks and vowels clip/overlap.
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.35rem' }], sm: ['0.875rem', { lineHeight: '1.6rem' }], base: ['1rem', { lineHeight: '1.85rem' }],
      lg: ['1.125rem', { lineHeight: '1.9rem' }], xl: ['1.25rem', { lineHeight: '2rem' }], '2xl': ['1.5rem', { lineHeight: '2.2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.7rem' }], '4xl': ['2.25rem', { lineHeight: '3.2rem' }], '5xl': ['3rem', { lineHeight: '4.2rem' }],
    },
    boxShadow: { card: '0 1px 2px rgba(16,42,67,.06), 0 4px 14px rgba(16,42,67,.07)' },
  } },
  plugins: [],
};
