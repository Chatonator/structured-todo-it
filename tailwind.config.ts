
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // ===== PALETTE CHAUDE TO-DO-IT 2.0 =====
        // Utilisation de HSL pour la cohérence avec les variables CSS
        
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        
        // ===== COULEURS SYSTÈME =====
        system: {
          success: '#16a34a',           // Vert vif
          warning: '#f59e0b',           // Orange vif
          error: '#dc2626',             // Rouge
          info: '#3b82f6'               // Bleu
        },

        // ===== COULEURS CATÉGORIES =====
        category: {
          obligation: '#dc2626',        // Rouge
          quotidien: '#f59e0b',         // Orange
          envie: '#16a34a',             // Vert
          autres: '#8b5cf6',            // Violet
          'obligation-light': '#fef2f2',
          'quotidien-light': '#fffbeb',
          'envie-light': '#f0fdf4',
          'autres-light': '#f5f3ff'
        },

        // ===== COULEURS PRIORITÉS =====
        // Rouge = Le plus important (Crucial)
        // Jaune = Important (Régulières)
        // Vert = Peut attendre (Envies)
        // Bleu = Si j'ai le temps (Optionnel)
        priority: {
          highest: '#dc2626',       // Rouge
          high: '#eab308',          // Jaune
          medium: '#16a34a',        // Vert
          low: '#3b82f6',           // Bleu
          'highest-light': '#fef2f2',
          'high-light': '#fefce8',
          'medium-light': '#f0fdf4',
          'low-light': '#eff6ff'
        },

        // ===== COULEURS CONTEXTES =====
        context: {
          pro: '#3b82f6',
          perso: '#8b5cf6',
          'pro-light': '#eff6ff',
          'perso-light': '#f5f3ff'
        },

        // ===== COULEURS SPÉCIALES =====
        pinned: '#f59e0b',

        habit: {
          DEFAULT: 'hsl(var(--habit))',
          light: 'hsl(var(--habit-light))',
          dark: 'hsl(var(--habit-dark))',
          foreground: 'hsl(var(--habit-foreground))'
        },

        reward: {
          DEFAULT: 'hsl(var(--reward))',
          light: 'hsl(var(--reward-light))',
          dark: 'hsl(var(--reward-dark))',
          foreground: 'hsl(var(--reward-foreground))'
        },

        project: {
          DEFAULT: 'hsl(var(--project))',
          light: 'hsl(var(--project-light))',
          dark: 'hsl(var(--project-dark))',
          foreground: 'hsl(var(--project-foreground))'
        }
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem', 
        sm: '0.25rem'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [],
} satisfies Config;
