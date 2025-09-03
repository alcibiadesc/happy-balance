/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Editorial Monochrome Palette
        white: '#FFFFFF',
        'soft-white': '#FEFEFE',
        'light-grey': '#F8F9FA',
        'medium-grey': '#E5E7EB',
        'text-grey': '#6B7280',
        'dark-grey': '#374151',
        charcoal: '#1F2937',
        black: '#000000',
        
        // Beige Accents
        'warm-beige': '#F5F3F0',
        'soft-beige': '#EAE6E1',
        
        // Financial Colors (Refined)
        income: '#10B981', // Sage green
        expense: '#EF4444', // Coral red
        savings: '#6366F1', // Indigo
        investment: '#8B5CF6', // Purple
        debt: '#F59E0B', // Amber
        
        // System Colors
        border: 'var(--color-medium-grey)',
        input: 'var(--color-white)',
        ring: 'var(--color-indigo)',
        background: 'var(--color-soft-white)',
        foreground: 'var(--color-dark-grey)',
        
        primary: {
          DEFAULT: 'var(--color-charcoal)',
          foreground: 'var(--color-white)',
        },
        secondary: {
          DEFAULT: 'var(--color-warm-beige)',
          foreground: 'var(--color-charcoal)',
        },
        destructive: {
          DEFAULT: 'var(--color-coral-red)',
          foreground: 'var(--color-white)',
        },
        muted: {
          DEFAULT: 'var(--color-light-grey)',
          foreground: 'var(--color-text-grey)',
        },
        accent: {
          DEFAULT: 'var(--color-warm-beige)',
          foreground: 'var(--color-charcoal)',
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