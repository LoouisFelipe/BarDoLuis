import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Assumindo que você tem um componente Skeleton do shadcn/ui

/**
 * Componente Skeleton para o Dashboard.
 * Implementa a sugestão do CPO para melhorar a experiência do usuário
 * durante o carregamento inicial, oferecendo um feedback visual mais rico
 * do que um simples spinner.
 */
export function DashboardSkeleton() {
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