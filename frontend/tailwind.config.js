/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        web3: {
          page:    '#020A14',
          card:    '#040D1A',
          nav:     '#071525',
          input:   '#0A1E35',
          hover:   '#061020',
          blue:    '#0EA5E9',
          green:   '#22C55E',
          orange:  '#F97316',
          amber:   '#EAB308',
          red:     '#EF4444',
          t1:      '#E2F0FF',
          t2:      '#5B9EC9',
          t3:      '#2E6080',
          t4:      '#1A3A50',
          border:  '#0A2540',
          border2: '#143355',
        },
      },
    },
  },
  plugins: [],
};
