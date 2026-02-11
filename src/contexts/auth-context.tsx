'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// UID do CEO para Bypass de Auditoria e Controle Total
const CEO_UID = "o0FzqC1oYoYYwjgJXbbgL4QoCe42";

export interface UserProfile extends DocumentData {
  uid: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'cashier' | 'waiter';
  createdAt?: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoadingAuth: boolean;
  authError: Error | null;
  isLoadingProfile: boolean;
  profileError: Error | null;
  isAuthReady: boolean;
  isAdmin: boolean;
  isCaixaOrAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Lógica de Permissões
  const isAdmin = user?.uid === CEO_UID || userProfile?.role === 'admin';
  const isCaixaOrAdmin = isAdmin || userProfile?.role === 'cashier';

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      setAuthError(null);
      setIsAuthReady(true);

      if (currentUser) {
        setIsLoadingProfile(true);
        setProfileError(null);
      } else {
        setUserProfile(null);
        setIsLoadingProfile(false);
        setProfileError(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    if (user) {
      const userProfileRef = doc(db, 'users', user.uid);
      unsubscribeProfile = onSnapshot(
        userProfileRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ ...docSnap.data(), uid: docSnap.id } as UserProfile);
          } else {
            // Se for o CEO e não tiver perfil, criamos um objeto virtual para não travar o app
            if (user.uid === CEO_UID) {
              setUserProfile({ uid: CEO_UID, name: 'CEO (Luis)', role: 'admin' } as UserProfile);
            } else {
              setUserProfile(null);
            }
          }
          setIsLoadingProfile(false);
          setProfileError(null);
        },
        (error) => {
          setProfileError(error);
          setIsLoadingProfile(false);
        }
      );
    } else {
      setUserProfile(null);
      setProfileError(null);
      setIsLoadingProfile(false);
    }

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await signOut(auth);
    } catch (error: any) {
      setAuthError(error);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const value = { 
    user, 
    userProfile, 
    isLoadingAuth, 
    authError, 
    isLoadingProfile, 
    profileError, 
    isAuthReady,
    isAdmin,
    isCaixaOrAdmin,
    login, 
    logout 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
