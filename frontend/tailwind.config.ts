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
        background: 'var(--background-color, #FDFBF9)',
        davinci: {
          black: 'var(--secondary-color, #1C1917)', // Charcoal (Primary Text / Secondary theme)
          card: '#FFFFFF',  // White Card
          gold: 'var(--primary-color, #C5A880)',  // Premium SaaS Gold
          'gold-hover': 'var(--primary-hover-color, #B39268)',
          white: '#FFFFFF',
          gray: '#71717A',  // Zinc Muted
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, var(--primary-color, #C5A880) 0%, var(--primary-light-color, #D8C3A5) 100%)',
        'dark-gradient': 'linear-gradient(180deg, var(--background-light-color, #FAF8F5) 0%, var(--background-color, #FDFBF9) 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
