'use client';
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Supplier } from '@/lib/schemas';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

interface SupplierFormModalProps {
  supplier?: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Supplier, 'id'>, id?: string) => Promise<string>;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ supplier, open, onOpenChange, onSave }) => {
  const defaultValues = useMemo(() => ({
      name: supplier?.name || '',
      contactPerson: supplier?.contactPerson || '',
      phone: supplier?.phone || '',
      email: supplier?.email || '',
      address: supplier?.address || '',
  }), [supplier]);
  
  const form = useForm<Omit<Supplier, 'id'>>({
    defaultValues,
  });

  const { formState: { isSubmitting }, handleSubmit, reset } = form;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [supplier, open, reset, defaultValues]);


  const onSubmit = async (data: Omit<Supplier, 'id'>) => {
    if (!data.name) {
        form.setError('name', { message: "O nome é obrigatório." });
        return;
    }
    
    try {
        await onSave(data, supplier?.id);
        onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar fornecedor: ", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          <DialogDescription>Preencha os detalhes para adicionar ou atualizar um fornecedor.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col overflow-hidden">
            <div className="flex-grow overflow-y-auto pr-6 -mr-6">
              <div className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl><Input placeholder="Nome da Empresa" {...field} autoComplete="organization" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pessoa de Contato</FormLabel>
                      <FormControl><Input placeholder="Pessoa de Contato (opcional)" {...field} value={field.value || ''} autoComplete="name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl><Input type="tel" placeholder="Telefone" {...field} value={field.value || ''} autoComplete="tel" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl><Input type="email" placeholder="E-mail (opcional)" {...field} value={field.value || ''} autoComplete="email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl><Input placeholder="Endereço (opcional)" {...field} value={field.value || ''} autoComplete="address-line1" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t">
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full justify-end">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? <Spinner /> : 'Salvar Fornecedor'}
                  </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
