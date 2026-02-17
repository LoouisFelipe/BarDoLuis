'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização soberana do Firebase para o BarDoLuis.
 * CTO: Garante conexão exclusiva com a instância 'bardoluis'.
 * Implementa resiliência total para evitar crashes no servidor (SSR).
 */

// 1. Inicializa o App (Singleton) com trava de segurança para SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth
const auth = getAuth(app);

/**
 * 3. Inicializa o Firestore apontando para a instância 'bardoluis'.
 * CTO: O ID do banco de dados é injetado explicitamente para evitar fallback para '(default)'.
 */
const db = getFirestore(app, 'bardoluis');

export { app, auth, db };
