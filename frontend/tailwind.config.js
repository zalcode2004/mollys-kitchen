export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        mist: 'rgb(var(--mist) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        bar: '#1D2B24',
        chili: '#D8392B',
        haldi: '#F6B91B',
        leaf: '#2F7D4F'
      },
      fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
};
