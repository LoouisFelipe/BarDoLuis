'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useData } from '@/contexts/data-context';
import { UserProfile } from '@/contexts/auth-context';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { UserCog, Eye, EyeOff, Lock } from 'lucide-react';

const userEditSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  role: z.enum(['admin', 'cashier', 'waiter']),
  newPassword: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "A senha deve ter pelo menos 6 caracteres"
  }),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, open, onOpenChange }) => {
  const { updateUserProfile } = useData();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name || '',
      role: user.role || 'waiter',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user.name || '',
        role: user.role || 'waiter',
        newPassword: '',
      });
    }
  }, [open, user, form]);

  const onSubmit = async (data: UserEditFormData) => {
    setProcessing(true);
    try {
      // 1. Atualizar perfil no Firestore
      await updateUserProfile(user.uid, {
        name: data.name,
        role: data.role,
      });

      // 2. Se houver nova senha, avisar que senhas devem ser alteradas via console ou email reset
      // Nota técnica: Alterar senha de outro usuário via Client SDK sem Admin SDK é restrito.
      // O campo serve como placeholder visual para a intenção de controle do CEO.
      if (data.newPassword) {
          toast({
              title: "Atenção sobre a Senha",
              description: "Para segurança, senhas devem ser redefinidas pelo próprio usuário ou via Console Firebase.",
              variant: "default",
          });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="text-primary" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Alterar informações de <strong>{user.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</FormLabel>
                  <FormControl><Input placeholder="Ex: Luis Felipe" {...field} className="h-12 font-bold" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Cargo / Permissão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 font-bold"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin" className="font-bold">Administrador (Total)</SelectItem>
                      <SelectItem value="cashier" className="font-bold">Caixa (Vendas e Financeiro)</SelectItem>
                      <SelectItem value="waiter" className="font-bold">Garçom (Apenas Comandas)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Lock size={10} /> Redefinir Senha (Opcional)
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Deixe em branco para manter" 
                        {...field} 
                        className="pr-10 h-12"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="h-12 font-bold uppercase text-xs">
                Cancelar
              </Button>
              <Button type="submit" disabled={processing} className="h-12 font-black uppercase text-sm shadow-lg flex-1">
                {processing ? <Spinner size="h-4 w-4" /> : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
