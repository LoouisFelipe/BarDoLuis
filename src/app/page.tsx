'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Spinner } from '@/components/ui/spinner';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Página raiz do BarDoLuis.
 * CTO: Refatorado para remover o Toaster redundante, centralizando-o no Layout raiz.
 */

export default function RootPage() {
  const { user, userProfile, logout, isAuthReady, isLoadingAuth, authError, isLoadingProfile, profileError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthReady && !user && !isLoadingAuth && !authError) {
      router.replace('/login');
    }
  }, [isAuthReady, user, router, isLoadingAuth, authError]);

  if (isLoadingAuth || !isAuthReady) {
    return <DashboardSkeleton />;
  }

  if (authError) {
    toast({
      title: "Erro de Autenticação",
      description: authError.message,
      variant: "destructive",
    });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 p-4">
        <p className="text-lg font-semibold mb-4">Ocorreu um erro na autenticação:</p>
        <p className="text-sm text-center">{authError.message}</p>
        <button onClick={() => router.replace('/login')} className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Ir para Login
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DataProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <DashboardHeader
          user={user}
          userProfile={userProfile}
          logout={logout}
          isAuthReady={isAuthReady}
          isLoadingProfile={isLoadingProfile}
          profileError={profileError}
        />
        {isLoadingProfile ? (
          <div className="flex items-center justify-center flex-grow">
            <Spinner size="h-12 w-12" />
          </div>
        ) : profileError ? (
          <div className="flex items-center justify-center flex-grow text-red-500 p-4">
            <p className="text-lg font-semibold mb-4">Erro ao carregar o perfil do usuário:</p>
            <p className="text-sm text-center">{profileError.message}</p>
          </div>
        ) : (
          <DashboardLayout />
        )}
      </div>
    </DataProvider>
  );
}
