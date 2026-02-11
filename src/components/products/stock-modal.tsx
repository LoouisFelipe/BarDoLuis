
'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Supplier } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

interface StockFormData {
    amount: string;
    cost: string;
    supplierId: string;
}

interface StockModalProps {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suppliers: Supplier[];
    onAddStock: (productId: string, amount: number, cost: number, supplierId?: string | null) => Promise<void>;
}

export const StockModal: React.FC<StockModalProps> = ({ product, open, onOpenChange, suppliers, onAddStock }) => { 
    const { toast } = useToast();
    const [processing, setProcessing] = useState(false);
    const form = useForm<StockFormData>({
        defaultValues: {
            amount: '',
            cost: '',
            supplierId: 'null'
        }
    });
    
    const { handleSubmit, control } = form;

    const onSubmit = async (data: StockFormData) => {
        let amountToAdd = parseFloat(data.amount);
        const numCost = parseFloat(data.cost) || 0;

        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            toast({
                title: 'Quantidade Inválida',
                description: 'A quantidade a adicionar deve ser maior que zero.',
                variant: 'destructive',
            });
            return;
        }

        if (product.saleType === 'dose' && product.baseUnitSize) {
            amountToAdd = amountToAdd * Number(product.baseUnitSize);
        }

        setProcessing(true);
        
        try {
            const supplierId = data.supplierId === 'null' ? null : data.supplierId;
            await onAddStock(product.id!, amountToAdd, numCost, supplierId);
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao atualizar estoque: ", error);
        } finally {
            setProcessing(false);
        }
    };
    
    const stockUnitLabel = product.saleType === 'dose' ? 'ml' : 'un.';
    const addAmountLabel = product.saleType === 'dose' ? 'garrafas/unidades' : 'unidades';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Estoque: {product.name}</DialogTitle>
                    <DialogDescription>Estoque atual: {product.stock} {stockUnitLabel}</DialogDescription>
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
                                        <FormLabel>Quantidade a adicionar ({addAmountLabel}):</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" required {...field} className="text-base" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="cost"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Custo Total da Compra (R$, opcional):</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Ex: 150.00" {...field} className="text-base" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="supplierId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fornecedor (opcional):</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="null">Nenhum</SelectItem>
                                                {suppliers.map(s => (
                                                    <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>
                                                ))}
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
                            <Button type="submit" disabled={processing}>
                                {processing ? <Spinner /> : 'Confirmar Entrada de Estoque'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
