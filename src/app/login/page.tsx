import React from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Recuperar Senha</h1>
        <p className="text-muted-foreground mb-6">Funcionalidade de recuperação de senha será implementada aqui.</p>
        <Link href="/login" className="text-primary hover:underline">Voltar para o Login</Link>
      </div>
    </div>
  );
}