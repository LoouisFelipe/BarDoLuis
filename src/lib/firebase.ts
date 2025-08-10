'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, type User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, where, enableIndexedDbPersistence, arrayUnion, writeBatch, addDoc, setDoc, getDoc, updateDoc, deleteDoc, type Firestore } from 'firebase/firestore';

export const appId = process.env.NEXT_PUBLIC_APP_ID;

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: ReturnType<typeof getAuth> | null = null;
let firestoreDb: Firestore | null = null;
let firebaseInitializationPromise: Promise<FirebaseApp> | null = null;

async function initializeFirebase(): Promise<FirebaseApp> {
  if (firebaseInitializationPromise) {
    return firebaseInitializationPromise;
  }

  firebaseInitializationPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Firebase can only be initialized on the client.'));
    }

    if (getApps().length) {
        const app = getApp();
        resolve(app);
        return;
    }

    const checkConfig = () => {
        const firebaseConfigStr = (window as any).__firebase_config;
        if (firebaseConfigStr) {
            try {
                const firebaseConfig = JSON.parse(firebaseConfigStr);
                if (firebaseConfig.projectId) {
                    const app = initializeApp(firebaseConfig);
                    resolve(app);
                } else {
                    reject(new Error('"projectId" not provided in firebase.initializeApp.'));
                }
            } catch (e) {
                reject(e);
            }
        } else {
            // If config is not there, wait and check again.
            setTimeout(checkConfig, 100); 
        }
    };
    checkConfig();
  });

  try {
    firebaseApp = await firebaseInitializationPromise;
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp);
    // Note: enableIndexedDbPersistence should only be called once, so we guard it.
    await enableIndexedDbPersistence(firestoreDb).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Firebase persistence error: Multiple tabs open, persistence can only be enabled in one tab at a a time.");
        } else if (err.code == 'unimplemented') {
            console.warn("Firebase persistence error: The current browser does not support all of the features required to enable persistence.");
        }
    });
  } catch (err: any) {
    console.error("Firebase initialization error:", err);
  }

  return firebaseApp;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const authAndListen = async () => {
            try {
                await initializeFirebase();
                const auth = getAuthInstance();
                if(!auth) {
                    setIsAuthReady(true); // Can't get auth instance, but we are "ready"
                    return;
 console.log("isAuthReady:", isAuthReady, "user:", user);
                };

                const initialAuthToken = (window as any).__initial_auth_token;
                if (initialAuthToken && auth.currentUser === null) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else if (auth.currentUser === null) {
                    await signInAnonymously(auth);
                }
                
                const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                    setIsAuthReady(true);
 console.log("isAuthReady:", isAuthReady, "user:", user);
                });

                return () => unsubscribe();
                 
            } catch (error: any) {
                console.error("Authentication failed:", error);
                const auth = getAuthInstance();
                if (auth && auth.currentUser === null) {
                    try {
                       await signInAnonymously(auth);
                    } catch (anonError) {
                       console.error("Anonymous sign-in also failed:", anonError);
                    }
                }
                setIsAuthReady(true); // Still ready, just not authenticated well
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
        const loadData = async () => {
            if (!isAuthReady) {
                return;
            }
            if (!user) {
                setData([]);
                setLoading(false);
                return;
            }

            await initializeFirebase();
            const db = getDb();
            if (!db) {
                setData([]);
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

            return unsubscribe;
        };

        const unsubscribePromise = loadData();

        return () => {
            unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
        };
    }, [isAuthReady, user, collectionName, JSON.stringify(options.where)]);

    return { data, loading };
}

export function useConfig(configId: string, defaultConfig: any) {
    const { user, isAuthReady } = useAuth();
    const [data, setData] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [docRef, setDocRef] = useState<any>(null);
    
    useEffect(() => {
        const init = async () => {
            if (!isAuthReady || !user) {
                if(isAuthReady) setLoading(false);
                return;
            };
            await initializeFirebase();
            const db = getDb();
            if(!db) {
                setLoading(false);
                return;
            };
            setDocRef(doc(db, `artifacts/${appId}/users/${user.uid}/config`, configId));
        };
        init();
    }, [isAuthReady, user, configId]);

    useEffect(() => {
        if (!docRef) {
            return;
        }
        setLoading(true);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data().values);
            } else {
                setData(defaultConfig);
                setDoc(docRef, { values: defaultConfig }).catch(e => console.error("Error creating default config:", e));
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching config:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [docRef, JSON.stringify(defaultConfig)]);

    const update = useCallback(async (newValue: any) => {
        if (!docRef) return;
        try {
            // Check if doc exists before trying to update it
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, {
                    values: arrayUnion(newValue)
                });
            } else {
                 await setDoc(docRef, { values: [newValue] });
            }
        } catch(e) {
             console.error("Error updating config:", e);
        }
    },[docRef]);

    return { data, loading, update };
}

const getDb = () => firestoreDb;
const getAuthInstance = () => firebaseAuth;

export { getDb, getAuthInstance, writeBatch, addDoc, setDoc, getDoc, updateDoc, deleteDoc, doc, collection };
