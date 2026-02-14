import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

/**
 * @fileOverview Inicialização centralizada e blindada do Firebase para o BarDoLuis.
 * Força a conexão com a instância de banco de dados 'bardoluis'.
 */

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CTO: Forçamos o ID do banco de dados para evitar conexões acidentais com '(default)'
const db = getFirestore(app, "bardoluis");
const auth = getAuth(app);

export { app, db, auth };
