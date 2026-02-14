// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

/**
 * REGRA DE OURO CTO: Inicialização centralizada do Firebase.
 * Utilizamos a configuração hardcoded para garantir que o sistema funcione
 * mesmo sem variáveis de ambiente configuradas no Cloud Workstation.
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * REGRA DE OURO CTO: Conexão obrigatória com a instância nomeada 'bardoluis'.
 * Isso garante que as Regras de Segurança aplicadas no console sejam respeitadas.
 */
const db = getFirestore(app, "bardoluis");
const auth = getAuth(app);

// Exportamos 'firebaseApp' para manter compatibilidade com o barrel file src/firebase/index.ts
export { app as firebaseApp, db, auth };
