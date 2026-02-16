'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização centralizada e resiliente do Firebase para o BarDoLuis.
 * CTO: Garante conexão direta com a instância nomeada 'bardoluis'.
 * A conexão é exportada como singleton para evitar múltiplas instâncias no cliente.
 */

// 1. Inicializa o App (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth
const auth = getAuth(app);

// 3. Inicializa o Firestore apontando explicitamente para a instância 'bardoluis'
// Esta é a fonte de verdade absoluta para o PDV e o BI Cockpit.
const db = getFirestore(app, 'bardoluis');

export { app, auth, db };
