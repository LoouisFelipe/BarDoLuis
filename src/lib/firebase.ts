// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verifica se já existe uma instância rodando para evitar erros de "App already initialized"
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * REGRA DE OURO CTO: Conexão obrigatória com a instância nomeada 'bardoluis'.
 * Isso garante que as Regras de Segurança aplicadas no console sejam respeitadas.
 */
const db = getFirestore(app, "bardoluis");
const auth = getAuth(app);

export { app, db, auth };
