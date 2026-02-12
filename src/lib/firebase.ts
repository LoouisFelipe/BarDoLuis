import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Inicializa a App do Firebase (Singleton pattern)
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa os serviços core
const auth = getAuth(firebaseApp);

// Inicializa o Firestore apontando para o banco de dados padrão do projeto
// Isso garante compatibilidade com as regras de segurança e o Firebase CLI
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };