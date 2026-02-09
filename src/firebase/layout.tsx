import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Você pode adicionar um layout específico para páginas de autenticação aqui, como um fundo ou um cabeçalho simples.
  return <>{children}</>;
}