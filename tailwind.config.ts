
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
        // ===== COULEURS SHADCN/UI BASE (STATIQUES) =====
        border: '#e2e8f0',
        input: '#e2e8f0', 
        ring: '#3b82f6',
        background: '#ffffff',
        foreground: '#0f172a',
        
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          foreground: '#0f172a'
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff'
        },
        muted: {
          DEFAULT: '#f8fafc',
          foreground: '#64748b'
        },
        accent: {
          DEFAULT: '#f1f5f9',
          foreground: '#0f172a'
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a'
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a'
        },
        sidebar: {
          DEFAULT: '#f8fafc',
          foreground: '#0f172a',
          primary: '#3b82f6',
          'primary-foreground': '#ffffff',
          accent: '#f1f5f9',
          'accent-foreground': '#0f172a',
          border: '#e2e8f0',
          ring: '#3b82f6'
        },
        
        // ===== COULEURS SYSTÈME =====
        system: {
          success: '#16a34a',
          warning: '#f59e0b', 
          error: '#ef4444',
          info: '#3b82f6'
        },

        // ===== COULEURS CATÉGORIES =====
        category: {
          obligation: '#dc2626',    // Rouge intense pour les obligations
          quotidien: '#f59e0b',     // Orange/jaune pour le quotidien
          envie: '#16a34a',         // Vert pour les envies/plaisirs
          autres: '#6366f1',        // Violet pour autres
          // Variantes light pour les backgrounds
          'obligation-light': '#fef2f2',
          'quotidien-light': '#fffbeb', 
          'envie-light': '#f0fdf4',
          'autres-light': '#eef2ff'
        },

        // ===== COULEURS PRIORITÉS =====
        priority: {
          highest: '#dc2626',       // Rouge intense
          high: '#f59e0b',          // Orange
          medium: '#eab308',        // Jaune
          low: '#22c55e',           // Vert
          // Variantes light
          'highest-light': '#fef2f2',
          'high-light': '#fffbeb',
          'medium-light': '#fefce8',
          'low-light': '#f0fdf4'
        },

        // ===== COULEURS CONTEXTES =====
        context: {
          pro: '#3b82f6',           // Bleu professionnel
          perso: '#8b5cf6',         // Violet personnel
          // Variantes light
          'pro-light': '#eff6ff',
          'perso-light': '#f5f3ff'
        },

        // ===== COULEUR ÉPINGLÉ =====
        pinned: '#f59e0b'           // Orange pour les tâches épinglées
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
