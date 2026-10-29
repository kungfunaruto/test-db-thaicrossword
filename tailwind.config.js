export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      navy: { DEFAULT: '#163A63', dark: '#0F2A47', deep: '#0A1E35', soft: '#2A5486' },
      gold: { DEFAULT: '#D6B25E', light: '#F1DFAE', dark: '#B08A35' },
      flame: '#F08A24', // orange from the emblem
      'blue-light': '#EDF4FA', 'gray-light': '#F5F7FA', surface: '#F6F8FB', line: '#E3E8EF', ink: '#1F2D3D', muted: '#5F6B7A',
    },
    fontFamily: {
      sans: ['"IBM Plex Sans Thai"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      display: ['Kanit', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      serif: ['Kanit', '"IBM Plex Sans Thai"', 'sans-serif'],
    },
    // Thai needs taller line boxes than Tailwind's Latin defaults, or tone marks and vowels clip/overlap.
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1.2rem' }],
      xs: ['0.75rem', { lineHeight: '1.35rem' }], sm: ['0.875rem', { lineHeight: '1.6rem' }], base: ['1rem', { lineHeight: '1.85rem' }],
      lg: ['1.125rem', { lineHeight: '1.9rem' }], xl: ['1.25rem', { lineHeight: '2rem' }], '2xl': ['1.5rem', { lineHeight: '2.2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.7rem' }], '4xl': ['2.25rem', { lineHeight: '3.2rem' }], '5xl': ['3rem', { lineHeight: '4.1rem' }], '6xl': ['3.6rem', { lineHeight: '4.6rem' }],
    },
    borderRadius: { '4xl': '2rem' },
    boxShadow: {
      card: '0 1px 2px rgba(15,42,71,.05), 0 6px 18px -6px rgba(15,42,71,.10)',
      lift: '0 2px 4px rgba(15,42,71,.06), 0 18px 40px -12px rgba(15,42,71,.25)',
      glow: '0 0 0 4px rgba(214,178,94,.25)',
      inset: 'inset 0 1px 0 rgba(255,255,255,.08)',
    },
    keyframes: {
      'fade-up': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
      'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      'scale-in': { from: { opacity: '0', transform: 'scale(.96) translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
      'slide-down': { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'none' } },
      'toast-in': { from: { opacity: '0', transform: 'translateX(24px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
      shimmer: { '100%': { transform: 'translateX(100%)' } },
      float: { '0%,100%': { transform: 'translateY(0) rotate(var(--r,0deg))' }, '50%': { transform: 'translateY(-14px) rotate(var(--r,0deg))' } },
      progress: { '0%': { transform: 'translateX(-100%) scaleX(.4)' }, '50%': { transform: 'translateX(30%) scaleX(.6)' }, '100%': { transform: 'translateX(120%) scaleX(.4)' } },
      pop: { '0%': { transform: 'scale(.6)', opacity: '0' }, '60%': { transform: 'scale(1.08)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
      'spin-slow': { to: { transform: 'rotate(360deg)' } },
      glint: { '0%,70%': { transform: 'translateX(-120%) skewX(-20deg)' }, '100%': { transform: 'translateX(220%) skewX(-20deg)' } },
    },
    animation: {
      'fade-up': 'fade-up .55s cubic-bezier(.2,.7,.2,1) both', 'fade-in': 'fade-in .4s ease both', 'scale-in': 'scale-in .22s cubic-bezier(.2,.8,.2,1) both',
      'slide-up': 'slide-up .3s cubic-bezier(.2,.8,.2,1) both', 'slide-down': 'slide-down .22s ease both', 'toast-in': 'toast-in .3s cubic-bezier(.2,.8,.2,1) both',
      shimmer: 'shimmer 1.4s infinite', float: 'float 7s ease-in-out infinite', progress: 'progress 1.1s ease-in-out infinite', pop: 'pop .45s cubic-bezier(.2,.8,.2,1) both',
      'spin-slow': 'spin-slow 24s linear infinite', glint: 'glint 5s ease-in-out infinite',
    },
  } },
  plugins: [],
};
