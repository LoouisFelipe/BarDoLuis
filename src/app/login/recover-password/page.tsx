
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/firebase/config'; // Certifique-se de que a exportação da sua configuração do Firebase é 'app'

const auth = getAuth(app);

const formSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
});

export default function RecoverPasswordPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      toast({
        title: 'Erro ao Recuperar Senha',
        description: error.message || 'Não foi possível enviar o e-mail de recuperação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>Insira seu e-mail para receber um link de redefinição de senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner /> : 'Enviar E-mail de Recuperação'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <a href="/login" className="text-primary hover:underline">
              Voltar para o Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
