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
 * CTO: Refatorado para garantir que a autenticação e os dados fluam sem erros de boot.
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

  // CEO: Feedback visual rico durante o carregamento
  if (isLoadingAuth || !isAuthReady) {
    return <DashboardSkeleton />;
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 p-4">
        <p className="text-lg font-semibold mb-4">Erro de Autenticação:</p>
        <p className="text-sm text-center mb-6">{authError.message}</p>
        <button 
          onClick={() => router.replace('/login')} 
          className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
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
          <div className="flex flex-col items-center justify-center flex-grow text-red-500 p-4">
            <p className="text-lg font-semibold">Erro ao carregar o perfil:</p>
            <p className="text-sm text-center opacity-70">{profileError.message}</p>
          </div>
        ) : (
          <DashboardLayout />
        )}
      </div>
    </DataProvider>
  );
}
