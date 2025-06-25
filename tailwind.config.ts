
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
				// Couleurs de base Shadcn/UI - gardées pour compatibilité
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
				
				// COULEURS CENTRALISÉES - Toutes basées sur les variables CSS
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
