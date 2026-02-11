// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Inicializa o Firebase usando a configuração centralizada
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa os serviços apontando para a instância correta 'bardoluis'
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp, 'bardoluis');

export { firebaseApp, auth, db };