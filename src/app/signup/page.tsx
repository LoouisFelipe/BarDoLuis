'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase/provider';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useFirebaseAuth();
  const db = useFirestore();

  const onSignup = async (data: FormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Criar o perfil no Firestore como Admin no banco específico 'bardoluis'
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: data.name,
        role: 'admin',
      });

      toast({
        title: 'Conta criada!',
        description: 'Bem-vindo ao BARDOLUIS. Você agora é um administrador.',
      });
      
      router.push('/');
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = 'Ocorreu um erro ao criar sua conta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      }
      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-none shadow-2xl bg-card">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo size={64}/>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Criar Conta</CardTitle>
            <CardDescription className="text-muted-foreground">Cadastre-se para começar a gerenciar seu bar.</CardDescription>
        </CardHeader>
        <CardContent>
            <form id="signup-form" onSubmit={handleSubmit(onSignup)} className="space-y-4">
            <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                id="name"
                placeholder="Seu nome"
                autoComplete="name"
                {...register('name', { required: 'O nome é obrigatório' })}
                className="mt-1 bg-secondary/50 border-none"
                />
                {errors.name && <p className="mt-2 text-sm text-destructive">{String(errors.name.message)}</p>}
            </div>
            <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
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
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                {...register('password', { required: 'A senha é obrigatória', minLength: { value: 6, message: 'Mínimo de 6 caracteres' } })}
                className="mt-1 bg-secondary/50 border-none"
                />
                {errors.password && <p className="mt-2 text-sm text-destructive">{String(errors.password.message)}</p>}
            </div>
            </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button type="submit" form="signup-form" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="h-5 w-5" /> : 'Criar Conta'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Fazer Login
              </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
