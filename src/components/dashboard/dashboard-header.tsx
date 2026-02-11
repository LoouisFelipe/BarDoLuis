'use client';

import React from 'react';
import { FirebaseUser, UserProfile } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button'; // Assumindo que você tem um componente Button
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Assumindo que você tem componentes Avatar
import { Skeleton } from '@/components/ui/skeleton'; // Para placeholders
import { LogOut, User } from 'lucide-react'; // Ícones

interface DashboardHeaderProps {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  isLoadingProfile: boolean;
  profileError: Error | null;
}

export function DashboardHeader({
  user,
  userProfile,
  logout,
  isAuthReady,
  isLoadingProfile,
  profileError,
}: DashboardHeaderProps) {
  const displayName = userProfile?.name || user?.email || 'Usuário';
  const userRole = userProfile?.role ? `(${userProfile.role})` : '';

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card text-card-foreground">
      <div className="flex items-center space-x-2">
        {/* CPO: Logo ou Título do BarDoLuis */}
        <h1 className="text-xl font-bold">BarDoLuis</h1>
      </div>

      <div className="flex items-center space-x-4">
        {isLoadingProfile ? (
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ) : profileError ? (
          <span className="text-sm text-red-500" title={profileError.message}>
            Erro ao carregar perfil
          </span>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {displayName} {userRole}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}