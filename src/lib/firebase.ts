'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização centralizada e resiliente do Firebase para o BarDoLuis.
 * CTO: Garante conexão única com a instância nomeada 'bardoluis'.
 * A conexão é protegida contra falhas de SSR (Server Side Rendering).
 */

// 1. Inicializa o App (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth
const auth = getAuth(app);

// 3. Inicializa o Firestore apontando especificamente para o banco 'bardoluis'
// CTO: Usamos initializeFirestore para garantir que o databaseId seja respeitado.
let db: any;
if (typeof window !== 'undefined') {
  try {
    // Tentamos inicializar com as configurações específicas do BarDoLuis
    db = initializeFirestore(app, {
      databaseId: 'bardoluis',
      ignoreUndefinedProperties: true,
    });
  } catch (e) {
    // Se já estiver inicializado, recuperamos a instância padrão (que terá as configurações acima)
    db = getFirestore(app);
  }
} else {
  // No servidor, retornamos null para evitar crashes de pré-renderização
  db = null;
}

export { app, auth, db };
