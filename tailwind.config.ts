
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	// SAFELIST COMPLÈTE - Classes dynamiques pour éviter que Tailwind les supprime
	safelist: [
		// Classes de base pour les thèmes
		'bg-theme-background',
		'bg-theme-foreground', 
		'bg-theme-muted',
		'bg-theme-accent',
		'bg-theme-border',
		'bg-theme-card',
		'bg-theme-input',
		'bg-theme-primary',
		'bg-theme-secondary',
		'bg-theme-sidebar',
		'text-theme-background',
		'text-theme-foreground',
		'text-theme-muted',
		'text-theme-accent',
		'text-theme-border',
		'text-theme-card',
		'text-theme-input',
		'text-theme-primary',
		'text-theme-secondary',
		'text-theme-sidebar',
		'border-theme-background',
		'border-theme-foreground',
		'border-theme-muted',
		'border-theme-accent',
		'border-theme-border',
		'border-theme-card',
		'border-theme-input',
		'border-theme-primary',
		'border-theme-secondary',
		'border-theme-sidebar',

		// Classes des catégories - toutes les variantes pour tous les slugs
		'bg-category-obligation',
		'bg-category-obligation-light',
		'bg-category-obligation-medium',
		'bg-category-obligation-dark',
		'text-category-obligation',
		'text-category-obligation-light',
		'text-category-obligation-medium',
		'text-category-obligation-dark',
		'border-category-obligation',
		'border-category-obligation-light',
		'border-category-obligation-medium',
		'border-category-obligation-dark',
		'border-l-category-obligation',
		'border-l-4',
		'border-l-8',

		'bg-category-quotidien',
		'bg-category-quotidien-light',
		'bg-category-quotidien-medium',
		'bg-category-quotidien-dark',
		'text-category-quotidien',
		'text-category-quotidien-light',
		'text-category-quotidien-medium',
		'text-category-quotidien-dark',
		'border-category-quotidien',
		'border-category-quotidien-light',
		'border-category-quotidien-medium',
		'border-category-quotidien-dark',
		'border-l-category-quotidien',

		'bg-category-envie',
		'bg-category-envie-light',
		'bg-category-envie-medium',
		'bg-category-envie-dark',
		'text-category-envie',
		'text-category-envie-light',
		'text-category-envie-medium',
		'text-category-envie-dark',
		'border-category-envie',
		'border-category-envie-light',
		'border-category-envie-medium',
		'border-category-envie-dark',
		'border-l-category-envie',

		'bg-category-autres',
		'bg-category-autres-light',
		'bg-category-autres-medium',
		'bg-category-autres-dark',
		'text-category-autres',
		'text-category-autres-light',
		'text-category-autres-medium',
		'text-category-autres-dark',
		'border-category-autres',
		'border-category-autres-light',
		'border-category-autres-medium',
		'border-category-autres-dark',
		'border-l-category-autres',

		// Classes des contextes
		'bg-context-pro',
		'bg-context-pro-light',
		'bg-context-pro-medium',
		'bg-context-pro-dark',
		'text-context-pro',
		'text-context-pro-light',
		'text-context-pro-medium',
		'text-context-pro-dark',
		'border-context-pro',
		'border-context-pro-light',
		'border-context-pro-medium',
		'border-context-pro-dark',

		'bg-context-perso',
		'bg-context-perso-light',
		'bg-context-perso-medium',
		'bg-context-perso-dark',
		'text-context-perso',
		'text-context-perso-light',
		'text-context-perso-medium',
		'text-context-perso-dark',
		'border-context-perso',
		'border-context-perso-light',
		'border-context-perso-medium',
		'border-context-perso-dark',

		// Classes des priorités
		'bg-priority-highest',
		'bg-priority-highest-light',
		'bg-priority-highest-medium',
		'bg-priority-highest-dark',
		'text-priority-highest',
		'text-priority-highest-light',
		'text-priority-highest-medium',
		'text-priority-highest-dark',
		'border-priority-highest',
		'border-priority-highest-light',
		'border-priority-highest-medium',
		'border-priority-highest-dark',
		'border-l-priority-highest',

		'bg-priority-high',
		'bg-priority-high-light',
		'bg-priority-high-medium',
		'bg-priority-high-dark',
		'text-priority-high',
		'text-priority-high-light',
		'text-priority-high-medium',
		'text-priority-high-dark',
		'border-priority-high',
		'border-priority-high-light',
		'border-priority-high-medium',
		'border-priority-high-dark',
		'border-l-priority-high',

		'bg-priority-medium',
		'bg-priority-medium-light',
		'bg-priority-medium-medium',
		'bg-priority-medium-dark',
		'text-priority-medium',
		'text-priority-medium-light',
		'text-priority-medium-medium',
		'text-priority-medium-dark',
		'border-priority-medium',
		'border-priority-medium-light',
		'border-priority-medium-medium',
		'border-priority-medium-dark',
		'border-l-priority-medium',

		'bg-priority-low',
		'bg-priority-low-light',
		'bg-priority-low-medium',
		'bg-priority-low-dark',
		'text-priority-low',
		'text-priority-low-light',
		'text-priority-low-medium',
		'text-priority-low-dark',
		'border-priority-low',
		'border-priority-low-light',
		'border-priority-low-medium',
		'border-priority-low-dark',
		'border-l-priority-low',

		// Classes système
		'bg-system-success',
		'bg-system-success-light',
		'bg-system-success-medium',
		'bg-system-success-dark',
		'text-system-success',
		'text-system-success-light',
		'text-system-success-medium',
		'text-system-success-dark',
		'border-system-success',
		'border-system-success-light',
		'border-system-success-medium',
		'border-system-success-dark',

		'bg-system-warning',
		'bg-system-warning-light',
		'bg-system-warning-medium',
		'bg-system-warning-dark',
		'text-system-warning',
		'text-system-warning-light',
		'text-system-warning-medium',
		'text-system-warning-dark',
		'border-system-warning',
		'border-system-warning-light',
		'border-system-warning-medium',
		'border-system-warning-dark',

		'bg-system-error',
		'bg-system-error-light',
		'bg-system-error-medium',
		'bg-system-error-dark',
		'text-system-error',
		'text-system-error-light',
		'text-system-error-medium',
		'text-system-error-dark',
		'border-system-error',
		'border-system-error-light',
		'border-system-error-medium',
		'border-system-error-dark',

		'bg-system-info',
		'bg-system-info-light',
		'bg-system-info-medium',
		'bg-system-info-dark',
		'text-system-info',
		'text-system-info-light',
		'text-system-info-medium',
		'text-system-info-dark',
		'border-system-info',
		'border-system-info-light',
		'border-system-info-medium',
		'border-system-info-dark',

		// Classes de drag & drop
		'bg-drop-zone',
		'bg-drop-zone-light',
		'text-drop-zone',
		'border-drop-zone',
		'bg-drop-active',
		'bg-drop-active-light',
		'text-drop-active',
		'border-drop-active',

		// Classes utilisées dans les animations et états
		'ring-2',
		'ring-blue-400',
		'ring-blue-500',
		'ring-theme-primary',
		'bg-blue-50',
		'bg-blue-100',
		'border-blue-300',
		'border-blue-400',
		'border-l-blue-500',
		'border-l-yellow-500',
		'text-blue-600',
		'text-green-500',
		'text-green-700',
		'text-red-500',
		'text-yellow-600',
		'hover:text-blue-600',
		'hover:text-green-700',
		'hover:text-red-500',
		'hover:text-yellow-600',

		// Classes d'indentation pour les niveaux
		'ml-0',
		'ml-3',
		'ml-6',

		// Classes de responsive et utilitaires
		'line-clamp-3',
		'break-words',
		'min-w-0',
		'flex-shrink-0',
		'opacity-30',
		'scale-95',
		'scale-102',
		'rotate-2',
		'z-50',
		'z-1000',
		'transition-all',
		'duration-200',
		'duration-300',

		// Classes pour les modes sombres
		'dark:bg-blue-900/10',
		'dark:bg-blue-900/20',
		'dark:bg-gray-800',
		'dark:text-white',
	],
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
				// CORRECTION MAJEURE : Synchronisation Shadcn/UI avec nos variables RGB
				border: 'rgb(var(--color-border))',
				input: 'rgb(var(--color-input))',
				ring: 'rgb(var(--color-primary))',
				background: 'rgb(var(--color-background))',
				foreground: 'rgb(var(--color-foreground))',
				primary: {
					DEFAULT: 'rgb(var(--color-primary))',
					foreground: 'rgb(var(--color-background))' // Contraste avec primary
				},
				secondary: {
					DEFAULT: 'rgb(var(--color-secondary))',
					foreground: 'rgb(var(--color-background))' // Contraste avec secondary
				},
				destructive: {
					DEFAULT: 'rgb(var(--color-error))',
					foreground: 'rgb(var(--color-background))'
				},
				muted: {
					DEFAULT: 'rgb(var(--color-muted))',
					foreground: 'rgb(var(--color-foreground))'
				},
				accent: {
					DEFAULT: 'rgb(var(--color-accent))',
					foreground: 'rgb(var(--color-foreground))'
				},
				popover: {
					DEFAULT: 'rgb(var(--color-card))',
					foreground: 'rgb(var(--color-foreground))'
				},
				card: {
					DEFAULT: 'rgb(var(--color-card))',
					foreground: 'rgb(var(--color-foreground))'
				},
				sidebar: {
					DEFAULT: 'rgb(var(--color-sidebar))',
					foreground: 'rgb(var(--color-foreground))',
					primary: 'rgb(var(--color-primary))',
					'primary-foreground': 'rgb(var(--color-background))',
					accent: 'rgb(var(--color-accent))',
					'accent-foreground': 'rgb(var(--color-foreground))',
					border: 'rgb(var(--color-border))',
					ring: 'rgb(var(--color-primary))'
				},
				
				// COULEURS CENTRALISÉES - Toutes basées sur les variables CSS du fichier colors.css
				theme: {
					background: 'rgb(var(--color-background))',
					foreground: 'rgb(var(--color-foreground))',
					muted: 'rgb(var(--color-muted))',
					accent: 'rgb(var(--color-accent))',
					border: 'rgb(var(--color-border))',
					card: 'rgb(var(--color-card))',
					input: 'rgb(var(--color-input))',
					primary: 'rgb(var(--color-primary))',
					secondary: 'rgb(var(--color-secondary))',
					sidebar: 'rgb(var(--color-sidebar))'
				},
				
				// COULEURS DES CATÉGORIES - Classes CSS générées automatiquement
				category: {
					obligation: {
						DEFAULT: 'rgb(var(--color-obligation))',
						light: 'rgba(var(--color-obligation), 0.1)',
						medium: 'rgba(var(--color-obligation), 0.3)',
						dark: 'rgba(var(--color-obligation), 0.8)'
					},
					quotidien: {
						DEFAULT: 'rgb(var(--color-quotidien))',
						light: 'rgba(var(--color-quotidien), 0.1)',
						medium: 'rgba(var(--color-quotidien), 0.3)',
						dark: 'rgba(var(--color-quotidien), 0.8)'
					},
					envie: {
						DEFAULT: 'rgb(var(--color-envie))',
						light: 'rgba(var(--color-envie), 0.1)',
						medium: 'rgba(var(--color-envie), 0.3)',
						dark: 'rgba(var(--color-envie), 0.8)'
					},
					autres: {
						DEFAULT: 'rgb(var(--color-autres))',
						light: 'rgba(var(--color-autres), 0.1)',
						medium: 'rgba(var(--color-autres), 0.3)',
						dark: 'rgba(var(--color-autres), 0.8)'
					}
				},
				
				// COULEURS DES CONTEXTES
				context: {
					pro: {
						DEFAULT: 'rgb(var(--color-context-pro))',
						light: 'rgba(var(--color-context-pro), 0.1)',
						medium: 'rgba(var(--color-context-pro), 0.3)',
						dark: 'rgba(var(--color-context-pro), 0.8)'
					},
					perso: {
						DEFAULT: 'rgb(var(--color-context-perso))',
						light: 'rgba(var(--color-context-perso), 0.1)',
						medium: 'rgba(var(--color-context-perso), 0.3)',
						dark: 'rgba(var(--color-context-perso), 0.8)'
					}
				},
				
				// COULEURS DES PRIORITÉS
				priority: {
					highest: {
						DEFAULT: 'rgb(var(--color-priority-highest))',
						light: 'rgba(var(--color-priority-highest), 0.1)',
						medium: 'rgba(var(--color-priority-highest), 0.3)',
						dark: 'rgba(var(--color-priority-highest), 0.8)'
					},
					high: {
						DEFAULT: 'rgb(var(--color-priority-high))',
						light: 'rgba(var(--color-priority-high), 0.1)',
						medium: 'rgba(var(--color-priority-high), 0.3)',
						dark: 'rgba(var(--color-priority-high), 0.8)'
					},
					medium: {
						DEFAULT: 'rgb(var(--color-priority-medium))',
						light: 'rgba(var(--color-priority-medium), 0.1)',
						medium: 'rgba(var(--color-priority-medium), 0.3)',
						dark: 'rgba(var(--color-priority-medium), 0.8)'
					},
					low: {
						DEFAULT: 'rgb(var(--color-priority-low))',
						light: 'rgba(var(--color-priority-low), 0.1)',
						medium: 'rgba(var(--color-priority-low), 0.3)',
						dark: 'rgba(var(--color-priority-low), 0.8)'
					}
				},
				
				// COULEURS SYSTÈME
				system: {
					success: {
						DEFAULT: 'rgb(var(--color-success))',
						light: 'rgba(var(--color-success), 0.1)',
						medium: 'rgba(var(--color-success), 0.3)',
						dark: 'rgba(var(--color-success), 0.8)'
					},
					warning: {
						DEFAULT: 'rgb(var(--color-warning))',
						light: 'rgba(var(--color-warning), 0.1)',
						medium: 'rgba(var(--color-warning), 0.3)',
						dark: 'rgba(var(--color-warning), 0.8)'
					},
					error: {
						DEFAULT: 'rgb(var(--color-error))',
						light: 'rgba(var(--color-error), 0.1)',
						medium: 'rgba(var(--color-error), 0.3)',
						dark: 'rgba(var(--color-error), 0.8)'
					},
					info: {
						DEFAULT: 'rgb(var(--color-info))',
						light: 'rgba(var(--color-info), 0.1)',
						medium: 'rgba(var(--color-info), 0.3)',
						dark: 'rgba(var(--color-info), 0.8)'
					}
				},
				
				// COULEURS DE DRAG & DROP
				drop: {
					zone: 'rgb(var(--color-drop-zone))',
					'zone-light': 'rgba(var(--color-drop-zone), 0.1)',
					active: 'rgb(var(--color-drag-active))',
					'active-light': 'rgba(var(--color-drag-active), 0.2)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
