import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

// Definir tipos para as props, alinhado com "ZERO UNDEFINED" & TYPING
interface DashboardHeaderProps {
  user: any; // Substituir 'any' pelo tipo real do usuário do Firebase
  userProfile: { name: string; role: string } | null; // Substituir pelo tipo real do perfil
  logout: (() => Promise<void>) | undefined;
  isAuthReady: boolean;
}

export function DashboardHeader({
  user,
  userProfile,
  logout,
  isAuthReady,
}: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <Logo size={32} />
        <h1 className="text-xl font-bold tracking-tight hidden sm:block">BARDOLUIS POS</h1>
      </div>
      {isAuthReady && user && userProfile && logout ? ( // Adicionado 'user' na condição para consistência
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            <UserIcon size={16} />
            <span className="hidden md:inline font-medium">{userProfile.name}</span>
            <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{userProfile.role}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      ) : (
        <div className="h-10 w-24 bg-muted animate-pulse rounded-md"></div> // Placeholder for loading state
      )}
    </header>
  );
}