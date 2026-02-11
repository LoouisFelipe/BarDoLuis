
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ShieldCheck } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(['admin', 'cashier', 'waiter']),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const db = useFirestore();
  const [processing, setProcessing] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'waiter',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setProcessing(true);
    // Usar uma app secundária para não deslogar o admin atual
    const tempApp = initializeApp(firebaseConfig, "temp-app-" + Date.now());
    const tempAuth = getAuth(tempApp);

    try {
      // 1. Criar no Auth
      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
      const newUser = userCredential.user;

      // 2. Criar perfil no Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date(),
      });

      toast({
        title: "Usuário Criado!",
        description: `${data.name} agora tem acesso como ${data.role}.`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      let message = "Não foi possível criar o usuário.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      
      toast({
        title: "Erro no Cadastro",
        description: message,
        variant: "destructive",
      });
    } finally {
      // Limpar a app temporária
      await deleteApp(tempApp);
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Novo Usuário do Sistema
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo membro para a equipe do Bar do Luis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl><Input placeholder="Ex: Luis Felipe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail de Acesso</FormLabel>
                  <FormControl><Input type="email" placeholder="usuario@bardoluis.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Temporária</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 6 dígitos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo / Permissão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador (Total)</SelectItem>
                      <SelectItem value="cashier">Caixa (Vendas e Financeiro)</SelectItem>
                      <SelectItem value="waiter">Garçom (Apenas Comandas)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processing} className="font-bold">
                {processing ? <Spinner size="h-4 w-4" /> : "Criar Acesso"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
