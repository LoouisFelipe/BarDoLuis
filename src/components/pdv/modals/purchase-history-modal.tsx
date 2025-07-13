'use client';
import React, { useMemo } from 'react';
import { useCollection } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '../spinner';

export const PurchaseHistoryModal = ({ supplier, userId, open, onOpenChange }) => {
    const { data: purchases, loading } = useCollection('purchases', { where: ['supplierId', '==', supplier.id] });
    const sortedPurchases = useMemo(() => {
        if (!purchases) return [];
        return purchases.sort((a,b) => b.createdAt.toDate() - a.createdAt.toDate());
    }, [purchases]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Histórico de Compras - {supplier.name}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-2">
                    {loading && <div className="flex justify-center p-8"><Spinner /></div>}
                    {!loading && sortedPurchases.length === 0 ? (
                        <p className="text-muted-foreground text-center p-8">Nenhuma compra registada para este fornecedor.</p>
                    ) : (
                        <ul className="space-y-4">
                            {sortedPurchases.map(purchase => (
                                <li key={purchase.id} className="bg-secondary p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-muted-foreground">{purchase.createdAt.toDate().toLocaleDateString('pt-BR')}</span>
                                        <span className="font-bold text-green-400">Total: R$ {purchase.totalCost.toFixed(2)}</span>
                                    </div>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {purchase.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between bg-background p-1 rounded-md">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span>@ R$ {item.unitCost.toFixed(2)}/un</span>
                                            </li>
                                        ))}
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
