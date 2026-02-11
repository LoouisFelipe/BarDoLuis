
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Inicializa os serviços do Firebase e retorna as instâncias dos SDKs.
 * Configurado para usar o banco de dados padrão '(default)'.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Erro ao inicializar Firebase App:", e);
      throw e;
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

/**
 * Retorna instâncias inicializadas do Auth e Firestore.
 * O Firestore é conectado à instância padrão do projeto.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp) // Removido 'bardoluis' para usar o banco (default)
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
