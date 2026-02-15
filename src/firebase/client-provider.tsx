
'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { app, db, auth } from '@/lib/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provedor de Cliente para o Firebase.
 * CTO: Implementa trava de montagem para evitar erros de hidratação
 * e garante que os serviços estejam disponíveis antes da renderização.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR ou antes da hidratação, exibimos um container neutro para evitar ChunkLoadErrors
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  // Se por algum motivo o servidor estiver instável, aguardamos os serviços
  if (!app || !db || !auth) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={app}
      auth={auth}
      firestore={db}
    >
      {children}
    </FirebaseProvider>
  );
}
