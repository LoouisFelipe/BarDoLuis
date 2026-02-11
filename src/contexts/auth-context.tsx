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
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { firebaseApp, auth, db } from '@/lib/firebase'; // Importa auth e db diretamente

// Tipos para o perfil do usuário (baseado no backend.json e page.tsx)
export interface UserProfile extends DocumentData {
  name?: string;
  email?: string;
  role?: 'admin' | 'waiter' | 'manager';
  // Adicione outras propriedades do perfil do usuário aqui
}

// Tipos para o contexto de autenticação
interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoadingAuth: boolean; // Indica se a autenticação está em processo (login, logout, verificação inicial)
  authError: Error | null; // Erro relacionado à autenticação
  isLoadingProfile: boolean; // Indica se o perfil do usuário está sendo carregado
  profileError: Error | null; // Erro relacionado ao carregamento do perfil
  isAuthReady: boolean; // Indica se o estado inicial de autenticação foi determinado
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // True inicialmente para verificar o estado de auth
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // Indica que a verificação inicial foi concluída

  // Efeito para monitorar o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false); // Autenticação inicial verificada
      setAuthError(null); // Limpa erros anteriores de auth
      setIsAuthReady(true); // O estado inicial de autenticação foi determinado

      if (currentUser) {
        // Se há um usuário, tenta carregar o perfil
        setIsLoadingProfile(true);
        setProfileError(null);
      } else {
        // Se não há usuário, limpa o perfil
        setUserProfile(null);
        setIsLoadingProfile(false);
        setProfileError(null);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  // Efeito para carregar o perfil do usuário do Firestore
  useEffect(() => {
    let unsubscribeProfile: () => void;

    if (user) {
      const userProfileRef = doc(db, 'users', user.uid);
      unsubscribeProfile = onSnapshot(
        userProfileRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            console.warn('Perfil do usuário não encontrado no Firestore.');
            setUserProfile(null);
          }
          setIsLoadingProfile(false);
          setProfileError(null);
        },
        (error) => {
          console.error('Erro ao carregar perfil do usuário:', error);
          setProfileError(error);
          setIsLoadingProfile(false);
          setUserProfile(null);
        }
      );
    } else {
      // Se não há usuário, garante que o perfil e o erro estejam limpos
      setUserProfile(null);
      setProfileError(null);
      setIsLoadingProfile(false);
    }

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user, db]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Erro de login:', error);
      setAuthError(error);
      throw error; // Re-throw para que o componente chamador possa lidar com ele
    } finally {
      setIsLoadingAuth(false);
    }
  }, [auth]);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Erro de logout:', error);
      setAuthError(error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [auth]);

  const value = { user, userProfile, isLoadingAuth, authError, isLoadingProfile, profileError, isAuthReady, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}