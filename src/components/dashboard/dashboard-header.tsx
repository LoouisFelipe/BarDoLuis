'use client';

import React from 'react';
import { FirebaseUser, UserProfile } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardHeaderProps {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  isLoadingProfile: boolean;
  profileError: Error | null;
}

/**
 * @fileOverview Cabeçalho do Dashboard.

 */
export function DashboardHeader({
  user,
  userProfile,
  logout,
  isAuthReady,
  isLoadingProfile,
  profileError,
}: DashboardHeaderProps) {
  const displayName = userProfile?.name || user?.email || 'Usuário';
  const roleLabel = userProfile?.role === 'admin' ? 'ADM' : userProfile?.role === 'cashier' ? 'CAIXA' : 'GARÇOM';

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card text-card-foreground shrink-0 shadow-sm z-50">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">BarDoLuis</h1>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Gestão Estratégica</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isLoadingProfile ? (
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-24 rounded-full" variant="shimmer" />
            <Skeleton className="h-8 w-8 rounded-full" variant="shimmer" />
          </div>
        ) : profileError ? (
          <span className="text-[10px] font-bold text-red-500 uppercase" title={profileError.message}>
            Erro de Perfil
          </span>
        ) : (
          <>
            <div className="flex items-center gap-3 pr-2 border-r border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black truncate max-w-[120px]">{displayName}</p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">{roleLabel}</p>
              </div>
              <Avatar className="border-2 border-primary/20 h-10 w-10">
                <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
                <AvatarFallback className="bg-muted">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair do Sistema" className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
