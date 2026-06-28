import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#F8F9FC',
          surface: '#FFFFFF',
          raised:  '#F1F3F7',
          overlay: '#EAECF2',
        },
        brand: {
          DEFAULT: '#2563EB',
          hover:   '#1D4ED8',
          light:   '#EFF6FF',
          muted:   '#BFDBFE',
        },
        success: {
          DEFAULT: '#16A34A',
          light:   '#DCFCE7',
          muted:   '#86EFAC',
        },
        warning: {
          DEFAULT: '#D97706',
          light:   '#FEF3C7',
          muted:   '#FCD34D',
        },
        danger: {
          DEFAULT: '#DC2626',
          light:   '#FEE2E2',
          muted:   '#FCA5A5',
        },
        neutral: {
          DEFAULT: '#6B7280',
          light:   '#F3F4F6',
        },
        text: {
          primary:   '#18181B',
          secondary: '#52525B',
          muted:     '#A1A1AA',
          inverse:   '#FFFFFF',
        },
        border: {
          DEFAULT: '#E4E4E7',
          subtle:  '#D1D5DB',
          strong:  '#9CA3AF',
        },
      },
      fontFamily: {
        sans:    ['var(--font-geist)', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'xs':    '0 1px 2px 0 rgba(0,0,0,0.05)',
        'sm':    '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'md':    '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'lg':    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.04)',
        'inner': 'inset 0 1px 3px rgba(0,0,0,0.06)',
        'brand': '0 0 0 3px rgba(37,99,235,0.15)',
        'none':  'none',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl':'1.25rem',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease forwards',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in':  'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
        'shimmer':   'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.85)' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
