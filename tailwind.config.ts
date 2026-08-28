import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			// Archivo (corps de texte) et Azimut (titres) — design system
  			// « The Elsassisch Design Systeme », 28/08/2026. Chargées via
  			// next/font dans layout.tsx, exposées ici en variables CSS.
  			sans: ['var(--font-archivo)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['var(--font-azimut)', 'Georgia', 'serif']
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			// Couleurs de The Elsassisch. Séparées des surfaces neutres
  			// (secondary, accent) à dessein : voir l'en-tête de globals.css.
  			// `rouge-texte` est le seul rouge admissible sur du texte.
  			marque: {
  				or: 'hsl(var(--marque-or))',
  				'or-sombre': 'hsl(var(--marque-or-sombre))',
  				rouge: 'hsl(var(--marque-rouge))',
  				'rouge-texte': 'hsl(var(--marque-rouge-texte))',
  				// Échelles complètes (design system, 28/08/2026) — bg-marque-rouge-500, etc.
  				'rouge-50': 'hsl(var(--marque-rouge-50))',
  				'rouge-100': 'hsl(var(--marque-rouge-100))',
  				'rouge-200': 'hsl(var(--marque-rouge-200))',
  				'rouge-300': 'hsl(var(--marque-rouge-300))',
  				'rouge-400': 'hsl(var(--marque-rouge-400))',
  				'rouge-500': 'hsl(var(--marque-rouge-500))',
  				'rouge-600': 'hsl(var(--marque-rouge-600))',
  				'rouge-700': 'hsl(var(--marque-rouge-700))',
  				'rouge-800': 'hsl(var(--marque-rouge-800))',
  				'rouge-900': 'hsl(var(--marque-rouge-900))',
  				'or-50': 'hsl(var(--marque-or-50))',
  				'or-100': 'hsl(var(--marque-or-100))',
  				'or-200': 'hsl(var(--marque-or-200))',
  				'or-300': 'hsl(var(--marque-or-300))',
  				'or-400': 'hsl(var(--marque-or-400))',
  				'or-500': 'hsl(var(--marque-or-500))',
  				'or-600': 'hsl(var(--marque-or-600))',
  				'or-700': 'hsl(var(--marque-or-700))',
  				'or-800': 'hsl(var(--marque-or-800))',
  				'or-900': 'hsl(var(--marque-or-900))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// Courbe unique des transitions d'état de l'app. Nommée plutôt
  		// qu'arbitraire : `ease-[cubic-bezier(0.2,0,0,1)]` est rejeté par
  		// Tailwind comme ambigu (« matches multiple utilities ») et ne produit
  		// alors AUCUNE règle — la transition retombe silencieusement sur `ease`.
  		transitionTimingFunction: {
  			doux: 'cubic-bezier(0.2, 0, 0, 1)'
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
