'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Inicializa os serviços do Firebase e retorna as instâncias dos SDKs.
 * Configurado explicitamente para usar o banco de dados 'bardoluis'.
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
 * O Firestore é conectado especificamente à instância do banco 'bardoluis'.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp, 'bardoluis')
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
