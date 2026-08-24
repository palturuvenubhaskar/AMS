/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        premium: {
          bg: '#050505',
          card: '#12141d',
          hover: '#1a1c26',
          border: '#222430',
        },
        brand: {
          purple: 'var(--color-brand-primary)', // Dynamic: Purple in light mode, Blue in dark mode
          light: 'var(--color-brand-light)',
        },
        surface: {
          base: '#F9FAFB',   // App Background
          panel: '#FFFFFF',  // Cards
        },
        pastel: {
          blue: '#E0F2FE',   // Tailwind sky-100
          peach: '#FFEDD5',  // Tailwind orange-100
          mint: '#DCFCE7',   // Tailwind green-100
          purple: '#F3E8FF', // Tailwind purple-100
          pink: '#FCE7F3',   // Tailwind pink-100
        },
        // Legacy palette mappings so existing classes don't break immediately while we transition
        palette: {
          dark: '#6941C6',
          medium: '#F4EBFF',
          light: '#F3E8FF',
          cream: '#F9FAFB',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.03)',
        'glass-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 10px rgba(0,0,0,0.02)',
      },
    },
  },
  plugins: [],
}
