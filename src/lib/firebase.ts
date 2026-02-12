import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Inicializa a App do Firebase (Singleton pattern)
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa os serviços core
const auth = getAuth(firebaseApp);

// Inicializa o Firestore apontando especificamente para o banco de dados 'bardoluis'
// conforme solicitado pelo CEO para garantir sincronia com os dados reais.
const db = getFirestore(firebaseApp, "bardoluis");

export { firebaseApp, auth, db };
