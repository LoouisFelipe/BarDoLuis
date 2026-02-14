'use client';

import { app, db, auth } from '@/lib/firebase';

/**
 * @fileOverview Barrel file para o Firebase.
 * Exporta os serviços inicializados e centraliza o acesso aos hooks.
 */

export function initializeFirebase() {
  return {
    firebaseApp: app,
    auth,
    firestore: db
  };
}

export * from './provider';
export * from './client-provider';
export * from '@/hooks/use-collection';
export * from '@/hooks/use-doc';
export * from '@/hooks/use-open-orders';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
