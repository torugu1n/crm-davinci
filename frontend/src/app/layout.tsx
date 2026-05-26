import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Providers from '@/components/Providers';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';
import DemoModePanel from '@/components/DemoModePanel';
import InteractiveTour from '@/components/InteractiveTour';

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
    <html lang="pt-BR">
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
        <InteractiveTour />
      </body>
    </html>
  );
}
