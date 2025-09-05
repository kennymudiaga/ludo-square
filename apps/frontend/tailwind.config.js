/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ludo game colors
        'ludo-red': '#dc2626',
        'ludo-blue': '#2563eb', 
        'ludo-green': '#16a34a',
        'ludo-yellow': '#eab308',
        'board-light': '#f3f4f6',
        'board-dark': '#e5e7eb',
      },
      fontFamily: {
        'game': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'dice-roll': 'rotate 0.6s ease-in-out',
        'token-move': 'pulse 0.3s ease-in-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
