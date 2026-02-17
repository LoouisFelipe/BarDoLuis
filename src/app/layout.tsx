import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BarDoLuis POS | Sistema de Gestão Estratégica',
  description: 'Gestão ágil de bar, estoque e financeiro para a Rua Tavares Bastos, Pompéia. Inteligência e controle total.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} scrollbar-hide`} suppressHydrationWarning>
        <FirebaseClientProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background selection:bg-primary/30">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}