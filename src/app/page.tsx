
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Spinner } from '@/components/ui/spinner';

export default function RootPage() {
  const { user, userProfile, logout, isAuthReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace('/login');
    }
  }, [isAuthReady, user, router]);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="h-12 w-12" />
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
   // Se userProfile existir, garantimos que 'name' nunca seja null usando '??'
   userProfile={userProfile ? { ...userProfile, name: userProfile.name ?? 'Usuário' } : null}
   logout={logout} 
   isAuthReady={isAuthReady} 
/>
        <DashboardLayout />
      </div>
    </DataProvider>
  );
}
