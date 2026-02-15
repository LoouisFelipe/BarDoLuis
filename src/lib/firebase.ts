'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

/**
 * @fileOverview Inicialização centralizada e blindada do Firebase para o BarDoLuis.
 * Força a conexão exclusiva com a instância de banco de dados 'bardoluis'.
 * CTO: Adicionada proteção para garantir execução apenas no cliente.
 */

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * CRITICAL: Apontamento direto para o banco de dados nomeado 'bardoluis'.
 * Usamos inicialização preguiçosa para evitar erros durante o SSR do Next.js.
 */
const db = getFirestore(app, "bardoluis");
const auth = getAuth(app);

export { app, db, auth };
