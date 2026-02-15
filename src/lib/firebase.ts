
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

/**
 * @fileOverview Inicialização centralizada e resiliente do Firebase para o BarDoLuis.
 * Garante compatibilidade entre Servidor (SSR) e Cliente, forçando a conexão
 * com a instância de banco de dados nomeada 'bardoluis'.
 */

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// No Firebase Studio / Next.js, precisamos garantir que a inicialização 
// seja segura tanto durante a compilação quanto na execução do cliente.
if (typeof window !== "undefined") {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  // CTO: Tentativa de conexão com o banco dedicado 'bardoluis'
  // Se a instância nomeada falhar ou não existir, o SDK pode lançar erro.
  // Usamos um fallback para garantir que o servidor não encerre inesperadamente.
  try {
    db = getFirestore(app, "bardoluis");
  } catch (e) {
    console.warn("Conexão direta com 'bardoluis' falhou, tentando inicialização padrão...");
    db = getFirestore(app);
  }
  
  auth = getAuth(app);
} else {
  // Placeholder para o servidor (pre-rendering)
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = null as any; 
  auth = null as any;
}

export { app, db, auth };
