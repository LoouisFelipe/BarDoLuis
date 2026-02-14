'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useData } from '@/contexts/data-context';
import { UserProfile } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { UserCog, Eye, EyeOff, Lock, Mail } from 'lucide-react';

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

      // 2. Nota técnica: Alterar senha de outro usuário via Client SDK sem Admin SDK é restrito.
      // O campo serve como placeholder para indicar a intenção comercial.
      if (data.newPassword) {
          toast({
              title: "Atenção sobre a Senha",
              description: "Por segurança, senhas devem ser alteradas pelo próprio usuário no primeiro login ou via Console.",
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
      <DialogContent className="sm:max-w-md bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="text-primary" />
            Gestão de Acesso: {user.name || 'Membro'}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase font-bold text-muted-foreground tracking-tighter">
            Controle de Identidade no Banco BarDoLuis
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nome de Exibição</FormLabel>
                  <FormControl><Input placeholder="Nome completo" {...field} className="h-12 bg-background border-2 focus:border-primary font-bold" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nível de Permissão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 font-bold"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin" className="font-bold uppercase text-xs">Administrador (Total)</SelectItem>
                      <SelectItem value="cashier" className="font-bold uppercase text-xs">Caixa (Operacional)</SelectItem>
                      <SelectItem value="waiter" className="font-bold uppercase text-xs">Garçom (Atendimento)</SelectItem>
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
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                    <Lock size={10} /> Definir Nova Senha (Opcional)
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Deixe em branco para manter" 
                        {...field} 
                        className="pr-10 h-12 bg-background border-2 font-bold"
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

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-[10px] font-bold text-primary uppercase leading-tight">
                    💡 DICA DO CTO: Para maior segurança, recomende que o usuário altere sua senha periodicamente através do link de redefinição por e-mail.
                </p>
            </div>

            <DialogFooter className="pt-4 gap-2 flex-col sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="h-12 font-bold uppercase text-xs order-2 sm:order-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={processing} className="h-12 font-black uppercase text-sm shadow-lg flex-1 order-1 sm:order-2">
                {processing ? <Spinner size="h-4 w-4" /> : "Gravar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
