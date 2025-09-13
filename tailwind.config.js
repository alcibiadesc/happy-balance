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
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#49A9A6",           // happy-teal
          "primary-content": "#ffffff",
          "secondary": "#A3E8DC",         // happy-mint  
          "secondary-content": "#374151",
          "accent": "#F6BD61",            // happy-gold
          "accent-content": "#374151", 
          "neutral": "#374151",           // dark-grey
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",          // white
          "base-200": "#F8F9FA",          // light-grey
          "base-300": "#E5E7EB",          // medium-grey
          "base-content": "#374151",      // dark-grey
          "info": "#49A9A6",              // happy-teal
          "info-content": "#ffffff",
          "success": "#A3E8DC",           // happy-mint
          "success-content": "#374151",
          "warning": "#F6BD61",           // happy-gold
          "warning-content": "#374151",
          "error": "#EF817F",             // happy-coral
          "error-content": "#ffffff",
        },
        dark: {
          "primary": "#2DD4BF",           // teal-400 for excellent contrast
          "primary-content": "#1F2937",   // dark text for better contrast
          "secondary": "#A3E8DC",         // happy-mint
          "secondary-content": "#1F2937",
          "accent": "#F6BD61",            // happy-gold
          "accent-content": "#1F2937",
          "neutral": "#1F2937",           // charcoal
          "neutral-content": "#E5E7EB",
          "base-100": "#1F2937",          // charcoal
          "base-200": "#374151",          // dark-grey
          "base-300": "#4B5563",          // darker text-grey for better contrast
          "base-content": "#F3F4F6",      // lighter content for better contrast
          "info": "#60A5FA",              // blue-400 for better contrast
          "info-content": "#1F2937",
          "success": "#22C55E",           // green-500 for better contrast
          "success-content": "#1F2937",
          "warning": "#FBBF24",           // amber-400 for better contrast
          "warning-content": "#1F2937",
          "error": "#F87171",             // red-400 for better contrast
          "error-content": "#1F2937",    // dark text for better contrast
        }
      }
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  },
};