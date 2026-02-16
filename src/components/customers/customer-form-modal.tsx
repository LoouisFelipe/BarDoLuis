'use client';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Customer } from '@/lib/schemas';

interface CustomerFormModalProps {
  customer?: Partial<Customer> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Customer, 'id'>, id?: string) => Promise<string>;
  onSuccess?: (id: string) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, open, onOpenChange, onSave, onSuccess }) => {
  const defaultValues = useMemo(() => ({
      name: customer?.name || '',
      contact: customer?.contact || '',
      balance: customer?.balance || 0,
      creditLimit: customer?.creditLimit ?? null,
  }), [customer]);

  const form = useForm<Omit<Customer, 'id'>>({
    defaultValues,
  });

  const { formState: { isSubmitting }, handleSubmit, reset } = form;

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [customer, open, reset, defaultValues]);

  const onSubmit = async (data: Omit<Customer, 'id'>) => {
    if (!data.name) {
        form.setError('name', { message: 'O nome é obrigatório.' });
        return;
    }

    try {
      const savedId = await onSave(data, customer?.id);
      if (onSuccess && !customer?.id) {
          onSuccess(savedId);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar cliente: ", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo para adicionar ou atualizar um cliente.</DialogDescription>
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
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome do Cliente" {...field} autoComplete="name"/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contato (Telefone ou E-mail)</FormLabel>
                        <FormControl>
                            <Input placeholder="(XX) XXXXX-XXXX ou email@exemplo.com" {...field} value={field.value || ''} autoComplete="tel" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite de Crédito (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Deixe em branco para sem limite"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t">
               <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto justify-end">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? <Spinner /> : 'Salvar Cliente'}
                </Button>
               </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
