'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização centralizada e resiliente do Firebase para o BarDoLuis.
 * CTO: Garante conexão direta com a instância nomeada 'bardoluis'.
 * O SDK do Firebase lida internamente com a resiliência entre Servidor e Cliente.
 */

// 1. Inicializa o App (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth
const auth = getAuth(app);

// 3. Inicializa o Firestore apontando explicitamente para a instância 'bardoluis'
// Isso garante que o app leia os dados corretos conforme configurado no console.
const db = getFirestore(app, 'bardoluis');

export { app, auth, db };
