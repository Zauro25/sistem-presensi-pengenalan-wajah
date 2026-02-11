/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#213C51',
          50: '#E8EDF1',
          100: '#D1DBE3',
          200: '#A3B7C7',
          300: '#7593AB',
          400: '#476F8F',
          500: '#213C51',
          600: '#1A3041',
          700: '#142431',
          800: '#0D1820',
          900: '#070C10',
        },
        secondary: {
          DEFAULT: '#EEEEEE',
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#FFFFFF',
          300: '#FAFAFA',
          400: '#F4F4F4',
          500: '#EEEEEE',
          600: '#D4D4D4',
          700: '#BABABA',
          800: '#A0A0A0',
          900: '#868686',
        },
        'primary-foreground': '#FFFFFF',
        'secondary-foreground': '#213C51',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        ring: '#213C51',
        accent: '#213C51',
        'accent-foreground': '#FFFFFF',
      },
    },
  },
  plugins: [],
}
