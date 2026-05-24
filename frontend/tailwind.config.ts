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
        background: '#FDFBF9',
        davinci: {
          black: '#1C1917', // Charcoal (Primary Text)
          card: '#FFFFFF',  // White Card
          gold: '#C5A880',  // Premium SaaS Gold
          'gold-hover': '#B39268',
          white: '#FFFFFF',
          gray: '#71717A',  // Zinc Muted
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C5A880 0%, #D8C3A5 100%)',
        'dark-gradient': 'linear-gradient(180deg, #FAF8F5 0%, #FDFBF9 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
