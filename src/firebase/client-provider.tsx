'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // CPO: Trava de montagem para evitar erros de hidratação (SSR vs Client mismatch)
  const [mounted, setMounted] = useState(false);

  const firebaseServices = useMemo(() => {
    // CTO: Apenas inicializa se estiver no navegador
    if (typeof window === 'undefined') return null;
    return initializeFirebase();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR ou antes da montagem, renderizamos um container neutro
  if (!mounted || !firebaseServices) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
