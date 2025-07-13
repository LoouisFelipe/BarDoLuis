'use client';
import { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, query, where, enableIndexedDbPersistence, arrayUnion } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-pdv-app';

let app: FirebaseApp;
if (typeof window !== 'undefined') {
    if (!getApps().length) {
        const firebaseConfigStr = (window as any).__firebase_config;
        if (!firebaseConfigStr) {
            console.error('Firebase config not found');
        } else {
            const firebaseConfig = JSON.parse(firebaseConfigStr);
            if (!firebaseConfig.projectId) {
                console.error('"projectId" not provided in firebase.initializeApp.');
            } else {
                 app = initializeApp(firebaseConfig);
            }
        }
    } else {
        app = getApp();
    }
}


export const db = typeof window !== 'undefined' ? getFirestore(app) : ({} as Firestore);
export const auth = typeof window !== 'undefined' ? getAuth(app) : ({} as any);

if (typeof window !== 'undefined') {
    try {
        enableIndexedDbPersistence(db)
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              console.warn("Múltiplas abas abertas, a persistência offline pode não funcionar corretamente.");
            } else if (err.code == 'unimplemented') {
              console.error("O navegador atual não suporta persistência offline.");
            }
          });
    } catch (error) {
        console.error("Erro ao inicializar persistência do Firebase:", error);
    }
}


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    useEffect(() => {
        const authAndListen = async () => {
            try {
                const initialAuthToken = (window as any).__initial_auth_token;
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error: any) {
                console.error("Authentication with custom token failed:", error);
                if (error.code === 'auth/invalid-custom-token') {
                    console.log("Falling back to anonymous sign-in.");
                    try {
                        await signInAnonymously(auth);
                    } catch (anonError) {
                        console.error("Anonymous sign-in also failed:", anonError);
                    }
                }
            }
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        };
        authAndListen();
    }, []);
    return { user, isAuthReady };
}

export function useCollection(collectionName: string, options: any = {}) {
    const { user, isAuthReady } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady || !user) return;
        setLoading(true);
        const collectionPath = `artifacts/${appId}/users/${user.uid}/${collectionName}`;
        
        let q;
        if (options.where) {
            q = query(collection(db, collectionPath), where(...options.where));
        } else {
            q = query(collection(db, collectionPath));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setData(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, user, collectionName, JSON.stringify(options.where)]);

    return { data, loading };
}

export function useConfig(configId: string, defaultConfig: any) {
    const { user, isAuthReady } = useAuth();
    const [data, setData] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);

    const docRef = useMemo(() => {
        if (!isAuthReady || !user) return null;
        return doc(db, `artifacts/${appId}/users/${user.uid}/config`, configId);
    }, [isAuthReady, user, configId]);

    useEffect(() => {
        if (!docRef) return;
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data().values);
            } else {
                setDoc(docRef, { values: defaultConfig }).catch(e => console.error("Error creating default config:", e));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [docRef, JSON.stringify(defaultConfig)]);

    const update = async (newValue: any) => {
        if (!docRef) return;
        await updateDoc(docRef, {
            values: arrayUnion(newValue)
        });
    };

    return { data, loading, update };
}
