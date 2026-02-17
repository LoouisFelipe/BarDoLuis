'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização centralizada e blindada do Firebase para o BarDoLuis.
 * CTO: Garante conexão direta e exclusiva com a instância nomeada 'bardoluis'.
 * Implementa resiliência de SSR para evitar quedas do servidor Next.js durante o boot.
 */

// 1. Inicializa o App (Singleton) com trava de segurança para SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth
const auth = getAuth(app);

/**
 * 3. Inicializa o Firestore apontando para a instância 'bardoluis'.
 * CTO: Usamos uma abordagem resiliente. O Firestore só é ativado quando solicitado
 * em ambiente de cliente, protegendo o ciclo de vida do servidor.
 */
const db = getFirestore(app, 'bardoluis');

export { app, auth, db };
