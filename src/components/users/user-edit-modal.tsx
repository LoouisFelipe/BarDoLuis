'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useData } from '@/contexts/data-context';
import { UserProfile } from '@/contexts/auth-context';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { UserCog } from 'lucide-react';

const userEditSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  role: z.enum(['admin', 'cashier', 'waiter']),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, open, onOpenChange }) => {
  const { updateUserProfile } = useData();
  const [processing, setProcessing] = useState(false);

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name || '',
      role: user.role || 'waiter',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user.name || '',
        role: user.role || 'waiter',
      });
    }
  }, [open, user, form]);

  const onSubmit = async (data: UserEditFormData) => {
    setProcessing(true);
    try {
      await updateUserProfile(user.uid, {
        name: data.name,
        role: data.role,
      });
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
