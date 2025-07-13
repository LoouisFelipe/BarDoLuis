
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, type User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where, enableIndexedDbPersistence, arrayUnion, writeBatch, addDoc, setDoc, getDoc, updateDoc, deleteDoc, type Firestore } from 'firebase/firestore';

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'bar-do-luis-app';

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore;
let initializationPromise: Promise<void> | null = null;

function initializeFirebase(): Promise<void> {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            // No-op on the server, initialization will happen on the client.
            return resolve();
        }
        
        const setup = () => {
            if (getApps().length === 0) {
                const firebaseConfigStr = (window as any).__firebase_config;
                if (firebaseConfigStr) {
                    const firebaseConfig = JSON.parse(firebaseConfigStr);
                    if (firebaseConfig.projectId) {
                        app = initializeApp(firebaseConfig);
                    } else {
                        return reject(new Error('"projectId" not provided in firebase.initializeApp.'));
                    }
                } else {
                     return reject(new Error('Firebase config not found on window object.'));
                }
            } else {
                app = getApp();
            }
            
            auth = getAuth(app);
            db = getFirestore(app);

            enableIndexedDbPersistence(db).catch((err) => {
                console.warn("Firebase persistence error:", err.code);
            });

            resolve();
        };
        
        // Wait for the window to be fully loaded to ensure all scripts have run
        if (document.readyState === 'complete') {
            setup();
        } else {
            window.addEventListener('load', setup);
        }
    });

    return initializationPromise;
}

// Initialize immediately on client-side
if (typeof window !== 'undefined') {
    initializeFirebase().catch(err => {
        console.error("Firebase initialization failed:", err);
    });
}


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        initializeFirebase().then(() => {
            const authAndListen = async () => {
                if (!auth) {
                    // This should not happen if initialization is successful
                    setIsAuthReady(true);
                    return;
                }
                try {
                    const initialAuthToken = (window as any).__initial_auth_token;
                    if (initialAuthToken && auth.currentUser === null) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else if (auth.currentUser === null) {
                        await signInAnonymously(auth);
                    }
                } catch (error: any) {
                    console.error("Authentication failed, falling back to anonymous:", error);
                    if (auth.currentUser === null) {
                        try {
                           await signInAnonymously(auth);
                        } catch (anonError) {
                           console.error("Anonymous sign-in also failed:", anonError);
                        }
                    }
                } finally {
                     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                        setUser(currentUser);
                        setIsAuthReady(true);
                    });
                    return () => unsubscribe();
                }
            };
            authAndListen();
        }).catch(error => {
            console.error("Auth setup failed due to Firebase init error:", error);
            setIsAuthReady(true);
        });
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
            return;
        }
        
        if (!db) {
            setLoading(false);
            return;
        }

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
        if (!isAuthReady || !user || !db) return null;
        return doc(db, `artifacts/${appId}/users/${user.uid}/config`, configId);
    }, [isAuthReady, user, configId]);

    useEffect(() => {
        if (!docRef) {
             if(isAuthReady && user) setLoading(false);
            return;
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

const getDb = () => db;
const getAuthInstance = () => auth;

export { getDb, getAuthInstance, writeBatch, addDoc, setDoc, getDoc, updateDoc, deleteDoc, doc, collection };
