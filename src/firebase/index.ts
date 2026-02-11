'use client';

import { firebaseApp, auth, db } from '@/lib/firebase';

/**
 * Retorna as instâncias já configuradas para o banco 'bardoluis'.
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
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
