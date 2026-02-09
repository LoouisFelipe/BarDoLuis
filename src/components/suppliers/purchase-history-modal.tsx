'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Supplier, Purchase } from '@/lib/schemas';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { where, collection, query } from 'firebase/firestore';

interface PurchaseHistoryModalProps {
    supplier: Supplier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({ supplier, open, onOpenChange }) => {
    
    const db = useFirestore();
    const purchasesQuery = useMemoFirebase(() => {
        if (!db || !supplier?.id) return null;
        return query(collection(db, 'purchases'), where('supplierId', '==', supplier.id));
    }, [db, supplier.id]);

    const { data: purchasesData, isLoading: loading } = useCollection<Purchase>(purchasesQuery);
    
    const sortedPurchases = useMemo(() => {
        if (!purchasesData) return [];
        const convertedData = purchasesData.map(p => ({
            ...p,
            createdAt: p.createdAt instanceof Date ? p.createdAt : new Date((p.createdAt as any).seconds * 1000)
        }));
        return convertedData.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [purchasesData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Histórico de Compras - {supplier.name}</DialogTitle>
                    <DialogDescription>Visualize todas as compras feitas deste fornecedor.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-2">
                    {loading && <div className="flex justify-center p-8"><Spinner /></div>}
                    {!loading && sortedPurchases.length === 0 ? (
                        <p className="text-muted-foreground text-center p-8">Nenhuma compra registrada para este fornecedor.</p>
                    ) : (
                        <ul className="space-y-4">
                            {sortedPurchases.map(purchase => (
                                <li key={purchase.id} className="bg-secondary p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-muted-foreground">{purchase.createdAt.toLocaleDateString('pt-BR')}</span>
                                        <span className="font-bold text-accent">Total: R$ {purchase.totalCost.toFixed(2)}</span>
                                    </div>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {purchase.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between bg-background p-1 rounded-md">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span>@ R$ {(Number(item.unitCost) || 0).toFixed(2)}/un</span>
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
