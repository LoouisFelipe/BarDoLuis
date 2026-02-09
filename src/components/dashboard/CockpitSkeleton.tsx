'use client';
import React from 'react';

export const CockpitSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full animate-pulse">
      {/* Card de Vendas por Hora */}
      <div className="bg-card p-4 rounded-lg shadow-sm h-[300px] flex flex-col justify-between">
        <div className="h-6 w-3/4 bg-muted mb-4 rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
      </div>
      {/* Card de Lucro por Produto */}
      <div className="bg-card p-4 rounded-lg shadow-sm h-[300px] flex flex-col justify-between">
        <div className="h-6 w-3/4 bg-muted mb-4 rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
      </div>
      {/* Card de Top Produtos */}
      <div className="bg-card p-4 rounded-lg shadow-sm h-[300px] flex flex-col justify-between">
        <div className="h-6 w-3/4 bg-muted mb-4 rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
      </div>
      {/* Adicione mais esqueletos conforme a necessidade do layout do Cockpit */}
    </div>
  );
};