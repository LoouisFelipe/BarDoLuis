'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização soberana do Firebase para o BarDoLuis.
 * CTO: Conexão direta e exclusiva com a instância de banco 'bardoluis'.
 * SSR: Resiliência garantida para evitar crashes no servidor.
 */

// 1. Inicialização do App (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicialização dos Serviços
export const auth = getAuth(app);

/**
 * 3. Inicialização do Firestore apontando para a instância personalizada.
 * CEO: Isso garante que o app nunca tente usar o banco '(default)'.
 */
export const db = getFirestore(app, 'bardoluis');

export { app };
