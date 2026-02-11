'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Spinner } from '@/components/ui/spinner';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { Toaster } from '@/components/ui/toaster'; // Assumindo que você tem um componente Toaster do shadcn/ui
import { useToast } from '@/components/ui/use-toast'; // Assumindo que você tem o hook useToast

export default function RootPage() {
  const { user, userProfile, logout, isAuthReady, isLoadingAuth, authError, isLoadingProfile, profileError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Redireciona para /login se a autenticação estiver pronta, não houver usuário
    // e não houver um processo de autenticação em andamento ou erro de autenticação.
    // Isso evita redirecionamentos prematuros ou sobreposição de mensagens de erro.
    if (isAuthReady && !user && !isLoadingAuth && !authError) {
      router.replace('/login');
    }
  }, [isAuthReady, user, router, isLoadingAuth, authError]);

  // Exibe o Skeleton UI enquanto a autenticação inicial está sendo verificada
  // ou qualquer processo de autenticação (login/logout) está em andamento.
  if (isLoadingAuth || !isAuthReady) {
    return (
      <DashboardSkeleton />
    );
  }

  // Se houver um erro de autenticação, exibe uma mensagem.
  // O CPO sugere Toasts para feedback, mas um erro crítico de auth pode precisar de uma tela dedicada.
  if (authError) {
    toast({
      title: "Erro de Autenticação",
      description: authError.message,
      variant: "destructive",
    });
    // Poderíamos renderizar uma tela de erro mais elaborada aqui, ou um botão para tentar novamente.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 p-4">
        <p className="text-lg font-semibold mb-4">Ocorreu um erro na autenticação:</p>
        <p className="text-sm text-center">{authError.message}</p>
        {/* Exemplo de botão para tentar novamente ou ir para o login */}
        <button onClick={() => router.replace('/login')} className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Ir para Login
        </button>
      </div>
    );
  }

  // Se a autenticação estiver pronta, sem erros, mas sem usuário,
  // o useEffect já deve ter acionado o redirecionamento.
  // Este é um fail-safe para evitar renderizar o dashboard sem usuário.
  if (!user) { // Este bloco será alcançado apenas se o redirecionamento ainda não ocorreu.
    return null;
  }

  return (
    <DataProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <DashboardHeader
          user={user}
          userProfile={userProfile} // userProfile pode ser null se ainda estiver carregando ou houver erro
          logout={logout}
          isAuthReady={isAuthReady}
          isLoadingProfile={isLoadingProfile} // Passa o estado de carregamento do perfil
          profileError={profileError} // Passa o erro do perfil
        />
        {isLoadingProfile ? (
          <div className="flex items-center justify-center flex-grow">
            <Spinner size="h-12 w-12" /> {/* Spinner específico para o carregamento do perfil */}
          </div>
        ) : profileError ? (
          <div className="flex items-center justify-center flex-grow text-red-500 p-4">
            <p className="text-lg font-semibold mb-4">Erro ao carregar o perfil do usuário:</p>
            <p className="text-sm text-center">{profileError.message}</p>
            {/* CPO: Poderíamos adicionar um botão de "Recarregar" aqui */}
          </div>
        ) : (
          <DashboardLayout />
        )}
      </div>
      <Toaster /> {/* Adiciona o Toaster para exibir mensagens */}
    </DataProvider>
  );
}
