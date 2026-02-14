'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Supplier, Purchase } from '@/lib/schemas';
import { useFirestore } from '@/firebase/provider';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { useCollection } from '@/hooks/use-collection';
import { where, collection, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Calendar, Receipt } from 'lucide-react';

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
            createdAt: p.createdAt instanceof Date ? p.createdAt : (p.createdAt as any)?.toDate ? (p.createdAt as any).toDate() : new Date()
        }));
        return convertedData.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [purchasesData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden bg-[#0F172A] border-border/40">
                <DialogHeader className="p-6 border-b border-border/20 bg-[#1E293B] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white">Histórico de Compras - {supplier.name}</DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs mt-1">Visualize todas as compras feitas deste fornecedor.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-4">
                    <ScrollArea className="h-full pr-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Spinner size="h-10 w-10" />
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Auditando registros...</p>
                            </div>
                        ) : sortedPurchases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-slate-500 opacity-50 italic text-center gap-4">
                                <Package size={48} />
                                <p>Nenhuma compra registrada para este fornecedor.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedPurchases.map(purchase => (
                                    <div key={purchase.id} className="bg-[#1E293B] border border-border/20 rounded-xl overflow-hidden shadow-xl">
                                        <div className="px-4 py-3 bg-[#334155]/30 flex justify-between items-center border-b border-border/10">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Calendar size={14} className="text-primary" />
                                                <span className="text-xs font-bold uppercase tracking-tight">
                                                    {format(purchase.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Total da Nota</span>
                                                <span className="text-base font-black text-accent">R$ {purchase.totalCost.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 space-y-2">
                                            {purchase.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-[#0F172A]/50 p-2 rounded-lg group hover:bg-[#0F172A] transition-colors border border-transparent hover:border-primary/20">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs font-black text-primary">{item.quantity}×</span>
                                                        <span className="text-xs font-medium text-slate-200">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-slate-500 font-bold">@ R$ {(Number(item.unitCost) || 0).toFixed(2)}/un</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
