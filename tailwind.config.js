/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Happy Balance Color Palette
        white: '#FFFFFF',
        'soft-white': '#FEFEFE',
        'light-grey': '#F8F9FA',
        'medium-grey': '#E5E7EB',
        'text-grey': '#6B7280',
        'dark-grey': '#374151',
        charcoal: '#1F2937',
        black: '#000000',
        
        // Happy Balance Brand Colors
        'happy-gold': '#F6BD61',      // Primary brand color
        'happy-coral': '#EF817F',     // Secondary/accent color
        'happy-teal': '#49A9A6',      // Calm, stable color
        'happy-mint': '#A3E8DC',      // Light, fresh accent
        
        // Financial Colors (Happy Balance themed)
        income: '#49A9A6',    // Happy teal - positive growth
        expense: '#EF817F',   // Happy coral - warm but noticeable
        savings: '#A3E8DC',   // Happy mint - fresh and growing
        investment: '#F6BD61', // Happy gold - valuable
        debt: '#EF817F',      // Happy coral - attention needed
        
        // System Colors
        border: 'var(--color-medium-grey)',
        input: 'var(--color-white)',
        ring: 'var(--color-indigo)',
        background: 'var(--color-soft-white)',
        foreground: 'var(--color-dark-grey)',
        
        primary: {
          DEFAULT: '#49A9A6', // Happy teal
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#A3E8DC', // Happy mint
          foreground: '#374151',
        },
        destructive: {
          DEFAULT: '#EF817F', // Happy coral
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F8F9FA',
          foreground: '#6B7280',
        },
        accent: {
          DEFAULT: '#F6BD61', // Happy gold
          foreground: '#374151',
        },
        card: {
          DEFAULT: 'var(--color-white)',
          foreground: 'var(--color-dark-grey)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        'display': ['72px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'h1': ['48px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'h2': ['36px', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'h3': ['24px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'h4': ['20px', { lineHeight: '1.4' }],
        'body-large': ['18px', { lineHeight: '1.6' }],
        'body-small': ['14px', { lineHeight: '1.5' }],
        'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
};