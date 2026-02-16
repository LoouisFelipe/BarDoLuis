'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização centralizada e resiliente do Firebase para o BarDoLuis.
 * CTO: Garante conexão direta e exclusiva com a instância nomeada 'bardoluis'.
 * Excluímos qualquer referência ao banco '(default)' para evitar inconsistências.
 */

// 1. Inicializa o App (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth
const auth = getAuth(app);

// 3. Inicializa o Firestore apontando obrigatoriamente para a instância 'bardoluis'
// CEO: Esta é a única fonte de verdade para o projeto.
const db = getFirestore(app, 'bardoluis');

export { app, auth, db };
