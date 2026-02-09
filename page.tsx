'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

/**
 * Este arquivo na raiz é uma redundância. 
 * Redirecionamos para a estrutura correta do App Router em /src/app.
 */
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Spinner size="h-12 w-12" />
    </div>
  );
}
