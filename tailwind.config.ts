import type { Config } from 'tailwindcss';

export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        system: {
          success: 'hsl(var(--system-success))',
          warning: 'hsl(var(--system-warning))',
          error: 'hsl(var(--system-error))',
          info: 'hsl(var(--system-info))',
        },
        category: {
          obligation: 'hsl(var(--category-obligation))',
          quotidien: 'hsl(var(--category-quotidien))',
          envie: 'hsl(var(--category-envie))',
          autres: 'hsl(var(--category-autres))',
          'obligation-light': 'hsl(var(--category-obligation-light))',
          'quotidien-light': 'hsl(var(--category-quotidien-light))',
          'envie-light': 'hsl(var(--category-envie-light))',
          'autres-light': 'hsl(var(--category-autres-light))',
        },
        priority: {
          highest: 'hsl(var(--priority-highest))',
          high: 'hsl(var(--priority-high))',
          medium: 'hsl(var(--priority-medium))',
          low: 'hsl(var(--priority-low))',
          'highest-light': 'hsl(var(--priority-highest-light))',
          'high-light': 'hsl(var(--priority-high-light))',
          'medium-light': 'hsl(var(--priority-medium-light))',
          'low-light': 'hsl(var(--priority-low-light))',
          'highest-dark': 'hsl(var(--priority-highest-dark))',
          'high-dark': 'hsl(var(--priority-high-dark))',
          'medium-dark': 'hsl(var(--priority-medium-dark))',
          'low-dark': 'hsl(var(--priority-low-dark))',
        },
        context: {
          pro: 'hsl(var(--context-pro))',
          perso: 'hsl(var(--context-perso))',
          'pro-light': 'hsl(var(--context-pro-light))',
          'perso-light': 'hsl(var(--context-perso-light))',
          'pro-dark': 'hsl(var(--context-pro-dark))',
          'perso-dark': 'hsl(var(--context-perso-dark))',
        },
        habit: {
          DEFAULT: 'hsl(var(--habit))',
          light: 'hsl(var(--habit-light))',
          dark: 'hsl(var(--habit-dark))',
          foreground: 'hsl(var(--habit-foreground))',
        },
        reward: {
          DEFAULT: 'hsl(var(--reward))',
          light: 'hsl(var(--reward-light))',
          dark: 'hsl(var(--reward-dark))',
          foreground: 'hsl(var(--reward-foreground))',
        },
        project: {
          DEFAULT: 'hsl(var(--project))',
          light: 'hsl(var(--project-light))',
          dark: 'hsl(var(--project-dark))',
          foreground: 'hsl(var(--project-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius-md)',
        md: 'var(--radius-sm)',
        sm: 'calc(var(--radius-sm) - 2px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
