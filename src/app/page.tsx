'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Página raiz do BarDoLuis.
 * CTO: Refatorado para consolidar o DashboardSkeleton e eliminar arquivos redundantes.
 */

function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background p-4">
      <div className="flex items-center justify-between h-16 border-b pb-4 mb-4">
        <Skeleton className="h-8 w-48" /> {/* Placeholder para o título/logo */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24 rounded-full" /> {/* Placeholder para o nome do usuário */}
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Placeholder para o avatar/botão de logout */}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
        <Skeleton className="h-48 col-span-1" /> {/* Placeholder para um card */}
        <Skeleton className="h-48 col-span-2" /> {/* Placeholder para um gráfico/tabela */}
        <Skeleton className="h-64 col-span-3" /> {/* Placeholder para o layout principal */}
      </div>
    </div>
  );
}

export default function RootPage() {
  const { user, userProfile, logout, isAuthReady, isLoadingAuth, authError, isLoadingProfile, profileError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthReady && !user && !isLoadingAuth && !authError) {
      router.replace('/login');
    }
  }, [isAuthReady, user, router, isLoadingAuth, authError]);

  // CEO: Feedback visual rico durante o carregamento inicial (agora consolidado)
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
