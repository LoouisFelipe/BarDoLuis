
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
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Calendar, Receipt, TrendingUp, ShoppingCart, Clock, ArrowUpRight, Boxes, Star, Repeat, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface PurchaseHistoryModalProps {
    supplier: Supplier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * @fileOverview Histórico de Compras Premium (Padrão Tavares Bastos).
 * CEO: Transformação de "Lista de Compras" em "Dashboard de Investimento".
 * CTO: Inteligência de Mix (Itens mais comprados, recorrência e valores).
 */
export const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({ supplier, open, onOpenChange }) => {
    
    const db = useFirestore();
    const purchasesQuery = useMemoFirebase(() => {
        if (!db || !supplier?.id) return null;
        return query(collection(db, 'purchases'), where('supplierId', '==', supplier.id));
    }, [db, supplier.id]);

    const { data: purchasesData, isLoading: loading } = useCollection<Purchase>(purchasesQuery);
    
    // Processamento de dados para o novo layout
    const purchases = useMemo(() => {
        if (!purchasesData) return [];
        return purchasesData.map(p => ({
            ...p,
            createdAt: p.createdAt instanceof Date ? p.createdAt : (p.createdAt as any)?.toDate?.() || new Date()
        })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [purchasesData]);

    const summary = useMemo(() => {
        const totalInvestment = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
        const totalItemsVolume = purchases.reduce((sum, p) => 
            sum + p.items.reduce((iSum, item) => iSum + (item.quantity || 0), 0), 0
        );
        return { totalInvestment, totalItemsVolume };
    }, [purchases]);

    // CEO: Inteligência de Itens Mais Comprados (Recorrência e Volume)
    const topItems = useMemo(() => {
        const stats: Record<string, { name: string, qty: number, totalCost: number, recurrence: number }> = {};
        
        purchases.forEach(p => {
            p.items.forEach(item => {
                const key = item.productId || item.name;
                if (!stats[key]) {
                    stats[key] = { name: item.name, qty: 0, totalCost: 0, recurrence: 0 };
                }
                stats[key].qty += (item.quantity || 0);
                stats[key].totalCost += (item.quantity || 0) * (item.unitCost || 0);
                stats[key].recurrence += 1;
            });
        });

        return Object.values(stats)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 4);
    }, [purchases]);

    const groupedPurchases = useMemo(() => {
        const groups: Record<string, Purchase[]> = {};
        purchases.forEach(p => {
            const dateKey = format(startOfDay(p.createdAt), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(p);
        });
        return groups;
    }, [purchases]);

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        if (isToday(date)) return 'HOJE';
        if (isYesterday(date)) return 'ONTEM';
        return format(date, "dd 'DE' MMMM, yyyy", { locale: ptBR }).toUpperCase();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[95vh] md:h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border/40 shadow-2xl">
                <DialogHeader className="p-6 border-b bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-lg shadow-primary/10">
                            <Receipt size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight uppercase truncate max-w-[200px] sm:max-w-none">
                                {supplier.name}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 mt-0.5">
                                <Clock size={10} className="text-primary" /> Histórico Analítico de Reposição
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Resumo Estratégico de Compras */}
                <div className="bg-muted/20 border-b shrink-0 shadow-inner">
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center gap-2 mb-1.5 text-primary">
                                <ArrowUpRight size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Investimento Total</span>
                            </div>
                            <p className="text-xl font-black text-foreground">R$ {summary.totalInvestment.toFixed(2)}</p>
                            <TrendingUp className="absolute -right-2 -bottom-2 h-12 w-12 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center gap-2 mb-1.5 text-accent">
                                <Boxes size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Volume de Itens</span>
                            </div>
                            <p className="text-xl font-black text-foreground">{summary.totalItemsVolume} un.</p>
                            <ShoppingCart className="absolute -right-2 -bottom-2 h-12 w-12 text-accent/5 -rotate-12 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>

                    {/* CEO: Dashboard de Itens Preferidos (Mix de Reposição) */}
                    {topItems.length > 0 && (
                        <div className="px-4 pb-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-sm">
                                <h4 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Star size={12} fill="currentColor" /> MIX DE REPOSIÇÃO (MAIS COMPRADOS)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {topItems.map((item, idx) => (
                                        <div key={idx} className="bg-card/40 border border-border/40 rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:border-primary/30 group/item">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[10px] font-black uppercase truncate pr-2 text-foreground group-hover/item:text-primary transition-colors">{item.name}</p>
                                                <Badge variant="secondary" className="text-[8px] font-black bg-slate-800 text-slate-400 h-4 px-1.5 border-none shrink-0">
                                                    <Repeat size={8} className="mr-1 text-primary" /> {item.recurrence}x
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Boxes size={10} className="text-muted-foreground" />
                                                    <span className="text-[10px] font-bold text-muted-foreground">{item.qty} un.</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign size={10} className="text-accent" />
                                                    <span className="text-[10px] font-black text-accent">R$ {item.totalCost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div className="p-4 pb-24">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Spinner size="h-10 w-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Auditando notas fiscais...</p>
                                </div>
                            ) : Object.keys(groupedPurchases).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-50 italic text-center gap-4">
                                    <div className="p-4 bg-muted/20 rounded-full"><Package size={48} /></div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em]">Nenhuma compra registrada</p>
                                </div>
                            ) : (
                                <Accordion type="multiple" defaultValue={[Object.keys(groupedPurchases)[0]]} className="space-y-4">
                                    {Object.keys(groupedPurchases).map((dateKey) => (
                                        <AccordionItem key={dateKey} value={dateKey} className="border-none bg-card/30 rounded-2xl overflow-hidden border border-border/10">
                                            <AccordionTrigger className="hover:no-underline py-4 px-5 group hover:bg-muted/20 transition-all">
                                                <div className="flex items-center gap-3 w-full">
                                                    <Calendar size={14} className="text-primary group-data-[state=open]:scale-110 transition-transform" />
                                                    <h3 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                                                        {formatDateHeader(dateKey)}
                                                    </h3>
                                                    <Badge variant="secondary" className="ml-auto text-[9px] font-black bg-slate-800 text-slate-400 border-none px-3">
                                                        {groupedPurchases[dateKey].length} NOTAS
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-0 pb-4 px-4 space-y-3">
                                                {groupedPurchases[dateKey].map((purchase) => (
                                                    <div key={purchase.id} className="relative p-4 rounded-xl bg-slate-900/60 border border-border/5 group transition-all hover:border-primary/20">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-lg transition-transform group-hover:scale-105 border border-primary/20">
                                                                    <ShoppingCart size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground font-black">
                                                                        {format(purchase.createdAt, "HH:mm")}
                                                                    </p>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                                                                        REPOSIÇÃO DE ESTOQUE
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total da Nota</p>
                                                                <p className="font-black text-lg text-primary tracking-tighter leading-none">
                                                                    R$ {purchase.totalCost.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Itens da Compra */}
                                                        <div className="mt-2 pt-3 border-t border-white/5 space-y-2">
                                                            {purchase.items.map((item, idx) => (
                                                                <div key={`${purchase.id}-${idx}`} className="flex justify-between items-center group/item">
                                                                    <div className="flex items-start gap-3 min-w-0">
                                                                        <span className="font-black text-primary text-[10px] min-w-[24px] h-6 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
                                                                            {item.quantity}x
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-bold uppercase tracking-tight truncate text-foreground group-hover/item:text-primary transition-colors">
                                                                                {item.name}
                                                                            </p>
                                                                            <p className="text-[9px] text-muted-foreground/60 font-medium">
                                                                                @ R$ {(Number(item.unitCost) || 0).toFixed(2)}/un
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[11px] font-black tabular-nums text-muted-foreground">
                                                                        R$ {((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
