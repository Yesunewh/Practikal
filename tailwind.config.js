/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        login: {
          mint: '#E8F1E9',
          sage: '#9BB0A4',
          sageDark: '#7E9488',
          ink: '#1a2e24',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        contentShift: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        feedbackOk: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        feedbackWrong: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '12%': { opacity: '1', transform: 'translateY(0)' },
          '22%': { transform: 'translateX(0)' },
          '32%': { transform: 'translateX(-7px)' },
          '42%': { transform: 'translateX(7px)' },
          '52%': { transform: 'translateX(-5px)' },
          '62%': { transform: 'translateX(5px)' },
          '72%': { transform: 'translateX(-2px)' },
          '82%': { transform: 'translateX(2px)' },
          '100%': { transform: 'translateX(0)' },
        },
        trophyPop: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '55%': { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.45s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'content-shift': 'contentShift 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'feedback-ok': 'feedbackOk 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'feedback-wrong': 'feedbackWrong 0.62s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards',
        'trophy-pop': 'trophyPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    },
  },
  plugins: [],
};
