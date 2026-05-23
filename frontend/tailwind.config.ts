import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        davinci: {
          black: '#0A0A0A',
          card: '#111111',
          gold: '#C6A15B',
          'gold-hover': '#E0B96D',
          white: '#F5F5F5',
          gray: '#A1A1AA',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C6A15B 0%, #E0B96D 100%)',
        'dark-gradient': 'linear-gradient(180deg, #111111 0%, #0A0A0A 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
