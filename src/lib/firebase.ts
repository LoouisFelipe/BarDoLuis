
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Inicialização centralizada do Firebase para o projeto BarDoLuis.
 * Garante que todos os serviços apontem para a instância oficial 'bardoluis'.
 */

// Inicializa a App do Firebase (Singleton pattern)
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa os serviços core
const auth = getAuth(firebaseApp);

// Inicializa o Firestore apontando ESPECIFICAMENTE para o banco de dados 'bardoluis'
// Isso é vital para garantir que as regras de segurança e os dados de produção sejam acessados corretamente.
const db = getFirestore(firebaseApp, "bardoluis");

export { firebaseApp, auth, db };
