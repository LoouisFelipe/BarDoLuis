'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/firebase/provider';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Eye, EyeOff } from 'lucide-react'; // CPO: Assumindo que 'lucide-react' está instalado para ícones
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [showPassword, setShowPassword] = useState(false); // CPO: Estado para alternar visibilidade da senha
  const router = useRouter();
  const { toast } = useToast();
  const auth = useFirebaseAuth();

  const handleAuthError = (error: any) => {
    console.error("Authentication error:", error.code, error.message);
    let errorMessage = 'Ocorreu um erro. Tente novamente.';
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            errorMessage = 'E-mail ou senha inválidos.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
            break;
    }
    toast({
        title: 'Falha na autenticação',
        description: errorMessage,
        variant: 'destructive',
    });
  };

  const onLogin = async (data: FormData) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/');
    } catch (error) {
      handleAuthError(error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-none shadow-2xl bg-card">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo size={64}/>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">BARDOLUIS POS</CardTitle>
            <CardDescription className="text-muted-foreground">Acesse sua conta para gerenciar o bar.</CardDescription>
        </CardHeader>
        <CardContent>
            <form id="login-form" onSubmit={handleSubmit(onLogin)} className="space-y-4">
            <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email', { required: 'O e-mail é obrigatório' })}
                className="mt-1 bg-secondary/50 border-none"
                />
                {errors.email && <p className="mt-2 text-sm text-destructive">{String(errors.email.message)}</p>}
            </div>
            <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                {...register('password', { required: 'A senha é obrigatória' })}
                className="mt-1 bg-secondary/50 border-none"
                />
                {errors.password && <p className="mt-2 text-sm text-destructive">{String(errors.password.message)}</p>}
            </div>
            </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button type="submit" form="login-form" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="h-5 w-5" /> : 'Entrar'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/signup" className="text-primary hover:underline font-semibold">
                Criar nova conta
              </Link>
            </p>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline font-semibold">
              Esqueceu a senha? {/* CPO: Link para recuperação de senha (a rota /forgot-password precisaria ser criada) */}
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
