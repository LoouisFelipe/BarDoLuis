'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Customer, Transaction } from "@/lib/schemas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, HandCoins, Calendar, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * @fileOverview Modal de Extrato do Cliente.
 * UX: Implementa visualização analítica com resumo financeiro e distinção clara entre consumo e pagamento.
 */
export const CustomerHistoryModal = ({ customer, transactions, open, onOpenChange }: CustomerHistoryModalProps) => {
  const customerTransactions = useMemo(() => {
    return transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
          const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
      });
  }, [transactions, customer.id]);

  const summary = useMemo(() => {
    const totalPurchases = customerTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    
    const totalPayments = customerTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return { totalPurchases, totalPayments };
  }, [customerTransactions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] md:h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border/40">
        <DialogHeader className="p-6 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User size={24} />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold">Extrato: {customer.name}</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">
                        Histórico financeiro e consumo detalhado
                    </DialogDescription>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo Devedor</p>
                <p className={cn("text-2xl font-black", (customer.balance || 0) > 0 ? "text-yellow-400" : "text-accent")}>
                    R$ {(customer.balance || 0).toFixed(2)}
                </p>
            </div>
          </div>
        </DialogHeader>

        {/* Resumo Financeiro Sticky */}
        <div className="bg-muted/20 p-4 border-b grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-1 text-destructive">
                    <ArrowUpRight size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Comprado</span>
                </div>
                <p className="text-lg font-black text-foreground">R$ {summary.totalPurchases.toFixed(2)}</p>
            </div>
            <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-1 text-accent">
                    <ArrowDownRight size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Pago</span>
                </div>
                <p className="text-lg font-black text-foreground">R$ {summary.totalPayments.toFixed(2)}</p>
            </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6 space-y-4">
              {customerTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 italic">
                    <p>Nenhuma transação encontrada para este cliente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerTransactions.map((transaction) => {
                    const date = transaction.timestamp instanceof Date ? transaction.timestamp : (transaction.timestamp as any)?.toDate?.() || new Date();
                    const isSale = transaction.type === 'sale';
                    
                    return (
                      <Card key={transaction.id} className="border-none shadow-md bg-card/40 hover:bg-card/60 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        isSale ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                                    )}>
                                        {isSale ? <ShoppingBag size={18} /> : <HandCoins size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {isSale ? 'Venda / Consumo' : 'Pagamento Efetuado'}
                                        </p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                            <Calendar size={10} />
                                            {format(date, "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "font-black text-lg",
                                        isSale ? "text-destructive" : "text-accent"
                                    )}>
                                        {isSale ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                                    </p>
                                    <Badge variant="outline" className="text-[8px] h-4 uppercase font-black tracking-tighter">
                                        {transaction.paymentMethod || 'N/A'}
                                    </Badge>
                                </div>
                            </div>

                            {isSale && transaction.items && transaction.items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                                    {transaction.items.map((item, idx) => (
                                        <div key={`${transaction.id}-${idx}`} className="flex justify-between items-baseline">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                    {item.quantity}x
                                                </span>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {item.name} {('doseName' in item && item.doseName) ? `(${item.doseName})` : ''}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground/70">
                                                R$ {('unitPrice' in item ? item.unitPrice * item.quantity : 0).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {!isSale && transaction.description && (
                                <p className="text-[11px] text-muted-foreground italic mt-1">
                                    &quot;{transaction.description}&quot;
                                </p>
                            )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
