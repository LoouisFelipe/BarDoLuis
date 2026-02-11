import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp, 'bardoluis');

export { firebaseApp, auth, db };
