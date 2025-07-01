/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
    darkMode: ['class'],
    content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
  				'var(--font-geist-sans)',
  				...fontFamily.sans
                ],
  			mono: [
  				'var(--font-geist-mono)',
                    ...fontFamily.mono
                ]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
  			sidebar: 'hsl(var(--sidebar) / <alpha-value>)',
  			'sidebar-foreground': 'hsl(var(--sidebar-foreground) / <alpha-value>)',
  			'sidebar-primary': 'hsl(var(--sidebar-primary) / <alpha-value>)',
  			'sidebar-primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
  			'sidebar-accent': 'hsl(var(--sidebar-accent) / <alpha-value>)',
  			'sidebar-accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
  			'sidebar-border': 'hsl(var(--sidebar-border) / <alpha-value>)',
  			'sidebar-ring': 'hsl(var(--sidebar-ring) / <alpha-value>)',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			info: {
  				DEFAULT: '#2563eb', // blue-600
  				light: '#3b82f6',   // blue-500
  				dark: '#1e40af',    // blue-800
  			},
  			success: {
  				DEFAULT: '#22c55e', // green-500
  				light: '#4ade80',   // green-400
  				dark: '#15803d',    // green-800
  			},
  			warning: {
  				DEFAULT: '#f59e42', // amber-400
  				light: '#fde68a',   // amber-200
  				dark: '#b45309',    // amber-700
  			},
  			error: {
  				DEFAULT: '#ef4444', // red-500
  				light: '#fca5a5',   // red-300
  				dark: '#991b1b',    // red-800
  			},
  		},
  		borderColor: {
  			DEFAULT: 'hsl(var(--border) / <alpha-value>)'
  		},
  		outlineColor: {
  			DEFAULT: 'hsl(var(--ring) / <alpha-value>)'
  		},
  		borderRadius: {
  			sm: '0.5rem',
  			md: '0.75rem',
  			lg: '1rem',
  			xl: '1.5rem',
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};
