'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Customer, Transaction, OrderItem } from "@/lib/schemas";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, HandCoins, Calendar, ArrowUpRight, ArrowDownRight, User, Star, TrendingUp, Clock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * @fileOverview Modal de Extrato Premium do Cliente.
 * UX: Agrupamento por datas, ranking de consumo e inteligência de crédito/dívida.
 */
export const CustomerHistoryModal = ({ customer, transactions, open, onOpenChange }: CustomerHistoryModalProps) => {
  
  // 1. Filtrar e ordenar transações do cliente
  const customerTransactions = useMemo(() => {
    return transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
          const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
      });
  }, [transactions, customer.id]);

  // 2. Calcular Resumo Financeiro
  const summary = useMemo(() => {
    const totalPurchases = customerTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    
    const totalPayments = customerTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return { totalPurchases, totalPayments };
  }, [customerTransactions]);

  // 3. Motor de Preferências: Ranking de Produtos mais consumidos
  const topConsumed = useMemo(() => {
    const counts: Record<string, number> = {};
    customerTransactions.forEach(t => {
      if (t.type === 'sale' && t.items) {
        t.items.forEach((item: any) => {
          counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1);
        });
      }
    });

    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  }, [customerTransactions]);

  // 4. Agrupamento por Datas
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    customerTransactions.forEach(t => {
      const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return groups;
  }, [customerTransactions]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const balance = customer.balance || 0;
  const isCredit = balance < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[95vh] md:h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border/40">
        <DialogHeader className="p-6 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User size={24} />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold truncate max-w-[200px] sm:max-w-none">{customer.name}</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter flex items-center gap-1">
                        <Clock size={10} /> Histórico de consumo e pagamentos
                    </DialogDescription>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-end gap-1">
                    {isCredit ? <Wallet size={10} className="text-accent" /> : null} 
                    {isCredit ? 'Saldo em Crédito' : 'Saldo Devedor'}
                </p>
                <p className={cn("text-2xl font-black", isCredit ? "text-accent" : balance > 0 ? "text-yellow-400" : "text-muted-foreground/20")}>
                    R$ {Math.abs(balance).toFixed(2)}
                </p>
            </div>
          </div>
        </DialogHeader>

        {/* Dash de Resumo e Preferências */}
        <div className="bg-muted/20 border-b shrink-0 overflow-hidden">
            <div className="p-4 grid grid-cols-2 gap-4">
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

            {/* Ranking de Consumo (Inteligência de Atendimento) */}
            {topConsumed.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                        <h4 className="text-[9px] font-black uppercase text-primary tracking-widest mb-2 flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Preferidos do Cliente (Top Consumo)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {topConsumed.map((item, idx) => (
                                <Badge key={idx} variant="outline" className="bg-background/50 border-primary/20 text-[10px] py-1">
                                    <span className="font-black mr-1 text-primary">{item.qty}x</span> {item.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6 pt-2 space-y-8">
              {Object.keys(groupedTransactions).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 italic">
                    <p>Nenhuma transação encontrada para este fiel.</p>
                </div>
              ) : (
                Object.keys(groupedTransactions).map((dateKey) => (
                  <div key={dateKey} className="space-y-3">
                    <div className="sticky top-0 z-10 py-1 bg-background/95 backdrop-blur-sm border-b border-border/10">
                        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                            <Calendar size={10} className="text-primary" /> {formatDateHeader(dateKey)}
                        </h3>
                    </div>
                    
                    <div className="space-y-3">
                        {groupedTransactions[dateKey].map((transaction) => {
                            const date = transaction.timestamp instanceof Date ? transaction.timestamp : (transaction.timestamp as any)?.toDate?.() || new Date();
                            const isSale = transaction.type === 'sale';
                            
                            return (
                            <Card key={transaction.id} className="border-none shadow-sm bg-card/40 hover:bg-card/60 transition-colors border-l-2 border-l-transparent hover:border-l-primary/40">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                isSale ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                                            )}>
                                                {isSale ? <ShoppingBag size={16} /> : <HandCoins size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">
                                                    {isSale ? (transaction.tabName || 'Venda / Consumo') : 'Pagamento Efetuado'}
                                                </p>
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase">
                                                    {format(date, "HH:mm")} • {transaction.paymentMethod || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black text-base",
                                                isSale ? "text-destructive" : "text-accent"
                                            )}>
                                                {isSale ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                                            </p>
                                            {isSale && transaction.discount && transaction.discount > 0 ? (
                                                <span className="text-[8px] font-bold text-accent uppercase">Desc: R$ {transaction.discount.toFixed(2)}</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    {isSale && transaction.items && transaction.items.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/10 space-y-1.5">
                                            {transaction.items.map((item, idx) => {
                                                const itemPrice = ('unitPrice' in item ? item.unitPrice : 0);
                                                const isItemCredit = itemPrice < 0;
                                                
                                                return (
                                                    <div key={`${transaction.id}-${idx}`} className="flex justify-between items-center text-[11px]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-primary min-w-[20px]">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className={cn("font-medium", isItemCredit ? "text-accent" : "text-muted-foreground")}>
                                                                {item.name} {('doseName' in item && item.doseName) ? `(${item.doseName})` : ''}
                                                            </span>
                                                        </div>
                                                        <span className={cn("font-bold opacity-60", isItemCredit ? "text-accent" : "text-muted-foreground/60")}>
                                                            R$ {(itemPrice * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {!isSale && transaction.description && (
                                        <p className="text-[10px] text-muted-foreground italic mt-1 pl-11">
                                            &quot;{transaction.description}&quot;
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
