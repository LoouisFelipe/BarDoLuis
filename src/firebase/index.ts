'use client';

import { firebaseApp, auth, db } from '@/lib/firebase';

/**
 * Inicialização centralizada dos serviços Firebase para o banco 'bardoluis'.
 */
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore: db
  };
}

export * from './provider';
export * from './client-provider';
export * from '@/hooks/use-collection';
export * from '@/hooks/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
