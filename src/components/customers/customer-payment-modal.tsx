
'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Customer } from '@/lib/schemas';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

interface CustomerPayment {
    amount: number;
    paymentMethod: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito';
}

interface CustomerPaymentModalProps {
    customerForPayment: Customer;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReceivePayment: (customer: Customer, amount: number, paymentMethod: string) => Promise<void>;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({ customerForPayment, open, onOpenChange, onReceivePayment }) => {
    const { toast } = useToast();
    const form = useForm<CustomerPayment>({
        defaultValues: {
            amount: customerForPayment?.balance || 0,
            paymentMethod: 'Dinheiro',
        }
    });

    const { formState: { isSubmitting }, handleSubmit, control, reset } = form;

    React.useEffect(() => {
        if (open && customerForPayment) {
            reset({
                amount: customerForPayment.balance || 0,
                paymentMethod: 'Dinheiro',
            });
        }
    }, [customerForPayment, open, reset]);


    const onSubmit = async (data: CustomerPayment) => {
        if (!customerForPayment) {
            return;
        }

        if (data.amount <= 0) {
            form.setError('amount', { message: 'O valor deve ser positivo.' });
            return;
        }
        if (data.amount > (customerForPayment.balance || 0)) {
            form.setError('amount', { message: 'O valor não pode ser maior que a dívida.' });
            return;
        }

        try {
            await onReceivePayment(customerForPayment, data.amount, data.paymentMethod);
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao registrar pagamento: ", error);
             toast({
                title: 'Erro no Pagamento',
                description: 'Não foi possível registrar o pagamento. Tente novamente.',
                variant: 'destructive',
            });
        }
    };
    
    if (!customerForPayment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Receber Pagamento de {customerForPayment.name}</DialogTitle>
                    <DialogDescription>Dívida total: R$ {(Number(customerForPayment.balance) || 0).toFixed(2)}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col overflow-hidden">
                        <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                            <div className="space-y-4 py-4">
                                <FormField
                                    control={control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor a Pagar (R$)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className="text-2xl font-bold h-auto text-base"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Forma de Pagamento</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                                    <SelectItem value="PIX">PIX</SelectItem>
                                                    <SelectItem value="Débito">Débito</SelectItem>
                                                    <SelectItem value="Crédito">Crédito</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? <Spinner /> : 'Confirmar Pagamento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
