
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
        // ===== PALETTE UNIFIÉE (15 COULEURS) =====
        // Noir/Texte
        border: '#e2e8f0',              // #1 - Gris clair (bordures)
        input: '#e2e8f0',
        ring: '#3b82f6',                // #2 - Bleu vif (focus)
        background: '#ffffff',          // #3 - Blanc pur
        foreground: '#0f172a',          // #4 - Noir bleuté (texte principal)
        
        primary: {
          DEFAULT: '#3b82f6',           // #2 - Bleu vif
          foreground: '#ffffff'         // #3 - Blanc pur
        },
        secondary: {
          DEFAULT: '#f1f5f9',           // #5 - Gris très clair
          foreground: '#0f172a'         // #4 - Noir bleuté
        },
        destructive: {
          DEFAULT: '#dc2626',           // #6 - Rouge foncé
          foreground: '#ffffff'         // #3 - Blanc pur
        },
        muted: {
          DEFAULT: '#f8fafc',           // #7 - Gris proche du blanc
          foreground: '#64748b'         // #8 - Gris moyen
        },
        accent: {
          DEFAULT: '#f1f5f9',           // #5 - Gris très clair
          foreground: '#0f172a'         // #4 - Noir bleuté
        },
        popover: {
          DEFAULT: '#ffffff',           // #3 - Blanc pur
          foreground: '#0f172a'         // #4 - Noir bleuté
        },
        card: {
          DEFAULT: '#ffffff',           // #3 - Blanc pur
          foreground: '#0f172a'         // #4 - Noir bleuté
        },
        sidebar: {
          DEFAULT: '#f8fafc',           // #7 - Gris proche du blanc
          foreground: '#0f172a',        // #4 - Noir bleuté
          primary: '#3b82f6',           // #2 - Bleu vif
          'primary-foreground': '#ffffff', // #3 - Blanc pur
          accent: '#f1f5f9',            // #5 - Gris très clair
          'accent-foreground': '#0f172a', // #4 - Noir bleuté
          border: '#e2e8f0',            // #1 - Gris clair
          ring: '#3b82f6'               // #2 - Bleu vif
        },
        
        // ===== COULEURS SYSTÈME =====
        system: {
          success: '#16a34a',           // #9 - Vert vif
          warning: '#f59e0b',           // #10 - Orange vif
          error: '#dc2626',             // #6 - Rouge foncé
          info: '#3b82f6'               // #2 - Bleu vif
        },

        // ===== COULEURS CATÉGORIES =====
        category: {
          obligation: '#dc2626',        // #6 - Rouge foncé
          quotidien: '#f59e0b',         // #10 - Orange vif
          envie: '#16a34a',             // #9 - Vert vif
          autres: '#8b5cf6',            // #11 - Violet
          // Variantes light
          'obligation-light': '#fffbeb', // #12 - Jaune très pâle
          'quotidien-light': '#fffbeb',  // #12 - Jaune très pâle
          'envie-light': '#f0fdf4',      // #13 - Vert très pâle
          'autres-light': '#eff6ff'      // #14 - Bleu très pâle
        },

        // ===== COULEURS PRIORITÉS =====
        priority: {
          highest: '#dc2626',           // #6 - Rouge foncé
          high: '#f59e0b',              // #10 - Orange vif
          medium: '#eab308',            // #15 - Jaune vif
          low: '#16a34a',               // #9 - Vert vif
          // Variantes light
          'highest-light': '#fffbeb',   // #12 - Jaune très pâle
          'high-light': '#fffbeb',      // #12 - Jaune très pâle
          'medium-light': '#fffbeb',    // #12 - Jaune très pâle
          'low-light': '#f0fdf4'        // #13 - Vert très pâle
        },

        // ===== COULEURS CONTEXTES =====
        context: {
          pro: '#3b82f6',               // #2 - Bleu vif
          perso: '#8b5cf6',             // #11 - Violet
          // Variantes light
          'pro-light': '#eff6ff',       // #14 - Bleu très pâle
          'perso-light': '#f5f3ff'      // Violet très pâle (proche #14)
        },

        // ===== COULEUR ÉPINGLÉ =====
        pinned: '#f59e0b',              // #10 - Orange vif

        // ===== COULEUR HABITUDES (16ème couleur) =====
        habit: {
          DEFAULT: '#ec4899',           // #16 - Rose vif (habitudes)
          light: '#fdf2f8',             // Rose très pâle
          dark: '#be185d',              // Rose foncé
          foreground: '#ffffff'         // Texte sur fond rose
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
