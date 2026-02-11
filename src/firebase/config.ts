import { initializeApp, getApp, getApps } from 'firebase/app';

export const firebaseConfig = {
  apiKey: "AIzaSyCoFEvyoAcvel_GDjYZnTzcpF4Ont_0EKE",
  authDomain: "bardoluis-86e9e.firebaseapp.com",
  databaseURL: "https://bardoluis-default-rtdb.firebaseio.com",
  projectId: "bardoluis",
  storageBucket: "bardoluis.firebasestorage.app",
  messagingSenderId: "392644795631",
  appId: "1:392644795631:web:b7fc6e28a257b669a64f1a",
  measurementId: "G-Y732X8EEZ9"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export { app };