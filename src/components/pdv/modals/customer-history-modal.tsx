'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export const CustomerHistoryModal = ({ customer, transactions, open, onOpenChange }) => {
    const customerSales = useMemo(() => {
        if (!transactions) return [];
        return transactions
            .filter(t => t.customerId === customer.id && t.type === 'sale')
            .sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
    }, [customer, transactions]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Histórico de Compras de {customer.name}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {customerSales.length === 0 ? (
                        <p className="text-muted-foreground">Nenhuma compra registrada para este cliente.</p>
                    ) : (
                        <ul className="space-y-3">
                            {customerSales.map(sale => (
                                <li key={sale.id} className="bg-secondary p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-muted-foreground">{sale.timestamp?.toDate().toLocaleDateString('pt-BR')}</span>
                                        <span className="font-bold text-green-400">R$ {sale.total.toFixed(2)}</span>
                                    </div>
                                    <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside pl-2">
                                        {sale.items.map(item => <li key={item.identifier}>{item.quantity}x {item.name} {item.subcategoria && `(${item.subcategoria})`}</li>)}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
