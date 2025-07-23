
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, type User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where, enableIndexedDbPersistence, arrayUnion, writeBatch, addDoc, setDoc, getDoc, updateDoc, deleteDoc, type Firestore } from 'firebase/firestore';

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'bar-do-luis-app';

let firebaseApp: FirebaseApp;
let firebaseAuth: ReturnType<typeof getAuth>;
let firestoreDb: Firestore;
let firebaseInitializationPromise: Promise<void> | null = null;

function initializeFirebase(): Promise<void> {
    if (firebaseInitializationPromise) {
        return firebaseInitializationPromise;
    }

    firebaseInitializationPromise = new Promise((resolve, reject) => {
        if (getApps().length > 0) {
            firebaseApp = getApp();
            firebaseAuth = getAuth(firebaseApp);
            firestoreDb = getFirestore(firebaseApp);
            resolve();
            return;
        }

        if (typeof window !== 'undefined') {
            const firebaseConfigStr = (window as any).__firebase_config;
            if (firebaseConfigStr) {
                try {
                    const firebaseConfig = JSON.parse(firebaseConfigStr);
                    if (firebaseConfig.projectId) {
                        firebaseApp = initializeApp(firebaseConfig);
                        firebaseAuth = getAuth(firebaseApp);
                        firestoreDb = getFirestore(firebaseApp);
                        enableIndexedDbPersistence(firestoreDb).catch((err) => {
                            console.warn("Firebase persistence error:", err.code);
                        });
                        resolve();
                    } else {
                        reject(new Error('"projectId" not provided in firebase.initializeApp.'));
                    }
                } catch (e) {
                    reject(e);
                }
            } else {
                 reject(new Error('Firebase config not found on window object.'));
            }
        } else {
             resolve();
        }
    });
    return firebaseInitializationPromise;
}


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const authAndListen = async () => {
            try {
                await initializeFirebase();
                if(!firebaseAuth) {
                    setIsAuthReady(true);
                    return;
                };

                const initialAuthToken = (window as any).__initial_auth_token;
                if (initialAuthToken && firebaseAuth.currentUser === null) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else if (firebaseAuth.currentUser === null) {
                    await signInAnonymously(firebaseAuth);
                }
            } catch (error: any) {
                console.error("Authentication failed, falling back to anonymous:", error);
                if (firebaseAuth && firebaseAuth.currentUser === null) {
                    try {
                       await signInAnonymously(firebaseAuth);
                    } catch (anonError) {
                       console.error("Anonymous sign-in also failed:", anonError);
                    }
                }
            } finally {
                 if(firebaseAuth){
                    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
                        setUser(currentUser);
                        setIsAuthReady(true);
                    });
                    return () => unsubscribe();
                 } else {
                    setIsAuthReady(true);
                 }
            }
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
        if (!isAuthReady || !user) {
            if (isAuthReady) setLoading(false);
            return () => {};
        }

        if (!firestoreDb) {
            initializeFirebase().then(() => {
                if(!firestoreDb) setLoading(false);
            });
            return () => {};
        }

        setLoading(true);
        const collectionPath = `artifacts/${appId}/users/${user.uid}/${collectionName}`;
        
        let q;
        if (options.where) {
            q = query(collection(firestoreDb, collectionPath), where(...options.where));
        } else {
            q = query(collection(firestoreDb, collectionPath));
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
        if (!isAuthReady || !user || !firestoreDb) return null;
        return doc(firestoreDb, `artifacts/${appId}/users/${user.uid}/config`, configId);
    }, [isAuthReady, user, configId]);

    useEffect(() => {
        if (!docRef) {
             if(isAuthReady && user) setLoading(false);
            return () => {};
        }
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data().values);
            } else {
                setDoc(docRef, { values: defaultConfig }).catch(e => console.error("Error creating default config:", e));
            }
            setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
    }, [docRef, JSON.stringify(defaultConfig)]);

    const update = useCallback(async (newValue: any) => {
        if (!docRef) return;
        try {
            await updateDoc(docRef, {
                values: arrayUnion(newValue)
            });
        } catch(e) {
             await setDoc(docRef, { values: [newValue] });
        }
    },[docRef]);

    return { data, loading, update };
}

const getDb = () => firestoreDb;
const getAuthInstance = () => firebaseAuth;

export { getDb, getAuthInstance, writeBatch, addDoc, setDoc, getDoc, updateDoc, deleteDoc, doc, collection };
