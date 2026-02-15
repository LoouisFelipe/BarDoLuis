import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

/**
 * @fileOverview Inicialização centralizada e blindada do Firebase para o BarDoLuis.
 * Força a conexão exclusiva com a instância de banco de dados 'bardoluis'.
 */

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * CRITICAL: Apontamento direto para o banco de dados nomeado 'bardoluis'.
 * Isso garante que as Regras de Segurança e os dados fiquem isolados.
 */
const db = getFirestore(app, "bardoluis");
const auth = getAuth(app);

export { app, db, auth };
