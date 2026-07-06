import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Barlow, Outfit, Instrument_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';
import DemoModePanel from '@/components/DemoModePanel';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-barlow',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  title: 'Plataforma para Salões e Barbearias',
  description: 'Gestão de clientes, agenda, catálogo e atendimento para negócios de beleza.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${outfit.variable} ${instrumentSans.variable}`}>
      <body>
        <Providers>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {children}
          </Suspense>
        </Providers>
        <ChunkErrorRecovery />
        <DemoModePanel />
      </body>
    </html>
  );
}
