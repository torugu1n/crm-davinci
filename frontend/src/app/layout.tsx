import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';

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
        <Providers>{children}</Providers>
        <ChunkErrorRecovery />
      </body>
    </html>
  );
}
