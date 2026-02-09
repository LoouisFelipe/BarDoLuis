
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser, useAuth as useFirebaseAuth } from '@/firebase/provider';
import { Spinner } from '@/components/ui/spinner';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'cashier' | 'waiter';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthReady: boolean;
  error: string | null;
  isAdmin: boolean;
  isCaixaOrAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading, userError } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const auth = useFirebaseAuth();
  const db = useFirestore();

  const logout = useCallback(async () => {
    await auth.signOut();
    setUserProfile(null);
    router.push('/login');
  }, [auth, router]);

  useEffect(() => {
    if (userError) {
        setError(userError.message);
    }
  }, [userError]);

  useEffect(() => {
    if (isUserLoading) {
      setProfileLoading(true);
      return;
    }

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
          setProfileLoading(false);
        } else {
          // Se o usuário acabou de criar a conta, o documento pode demorar um milissegundo.
          // Não deslogamos imediatamente para permitir o fluxo de signup.
          setUserProfile(null);
          setProfileLoading(false);
        }
      }, (profileError) => {
         console.error("Error fetching user profile:", profileError);
         setError("Failed to fetch user profile.");
         setProfileLoading(false);
      });

      return () => unsubProfile();
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user, isUserLoading, db]);
  
  const isAuthReady = !isUserLoading && !profileLoading;

  const isAdmin = userProfile?.role === 'admin';
  const isCaixaOrAdmin = userProfile?.role === 'admin' || userProfile?.role === 'cashier';

  const value = {
    user,
    userProfile,
    isAuthReady,
    error,
    isAdmin,
    isCaixaOrAdmin,
    logout,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
