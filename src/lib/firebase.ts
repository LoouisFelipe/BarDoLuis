
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Inicializa o Firebase apenas uma vez de forma segura
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Conecta explicitamente à instância 'bardoluis' do seu projeto
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp, 'bardoluis');

export { firebaseApp, auth, db };
