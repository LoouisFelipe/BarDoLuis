
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecoverPasswordRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-muted-foreground">
      <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Redirecionando...</p>
    </div>
  );
}
