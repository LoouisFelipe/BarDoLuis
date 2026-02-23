'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Customer, Transaction } from "@/lib/schemas";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, HandCoins, Calendar, ArrowUpRight, ArrowDownRight, User, Star, Clock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * @fileOverview Modal de Extrato Premium do Cliente.
 * UX: Agrupamento por datas, ranking de consumo e transparência em pagamentos híbridos (Saldo + Outro).
 * CTO: Implementação de lógica de agrupamento cronológico e motor de preferências.
 */
export const CustomerHistoryModal = ({ customer, transactions, open, onOpenChange }: CustomerHistoryModalProps) => {
  
  // 1. Filtrar e ordenar transações do cliente (mais recentes primeiro)
  const customerTransactions = useMemo(() => {
    return transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
          const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
      });
  }, [transactions, customer.id]);

  // 2. Calcular Resumo Financeiro Geral
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

  // 4. Agrupamento por Datas para Timeline
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
      <DialogContent className="max-w-2xl h-[95vh] md:h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border/40 shadow-2xl">
        <DialogHeader className="p-6 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-lg shadow-primary/10">
                    <User size={28} />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black tracking-tight truncate max-w-[200px] sm:max-w-none">{customer.name}</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} className="text-primary" /> Histórico de consumo e pagamentos
                    </DialogDescription>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center justify-end gap-1.5 mb-1">
                    {isCredit ? <Wallet size={10} className="text-accent" /> : null} 
                    {isCredit ? 'Saldo em Crédito' : 'Saldo Devedor'}
                </p>
                <p className={cn(
                    "text-3xl font-black tracking-tighter leading-none", 
                    isCredit ? "text-accent drop-shadow-[0_0_15px_rgba(20,184,166,0.2)]" : balance > 0 ? "text-yellow-400" : "text-muted-foreground/20"
                )}>
                    R$ {Math.abs(balance).toFixed(2)}
                </p>
            </div>
          </div>
        </DialogHeader>

        {/* Dash de Resumo e Preferências */}
        <div className="bg-muted/20 border-b shrink-0 overflow-hidden shadow-inner">
            <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5 text-destructive">
                        <ArrowUpRight size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">Total Comprado</span>
                    </div>
                    <p className="text-xl font-black text-foreground">R$ {summary.totalPurchases.toFixed(2)}</p>
                </div>
                <div className="bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5 text-accent">
                        <ArrowDownRight size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">Total Pago</span>
                    </div>
                    <p className="text-xl font-black text-foreground">R$ {summary.totalPayments.toFixed(2)}</p>
                </div>
            </div>

            {/* Ranking de Consumo (Inteligência de Atendimento) */}
            {topConsumed.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-sm">
                        <h4 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Star size={12} fill="currentColor" /> Preferidos do Cliente (TOP CONSUMO)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {topConsumed.map((item, idx) => (
                                <Badge key={idx} variant="outline" className="bg-background/50 border-primary/30 text-[10px] font-bold py-1.5 px-3 rounded-xl transition-all hover:bg-primary/10">
                                    <span className="font-black mr-1.5 text-primary">{item.qty}x</span> {item.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full w-full">
            <div className="p-6 pt-2 space-y-10 pb-20">
              {Object.keys(groupedTransactions).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 italic text-center gap-4">
                    <div className="p-4 bg-muted/20 rounded-full"><Clock size={48} /></div>
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhuma transação encontrada.</p>
                </div>
              ) : (
                Object.keys(groupedTransactions).map((dateKey) => (
                  <div key={dateKey} className="space-y-4">
                    <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-sm border-b border-border/10">
                        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2.5">
                            <Calendar size={12} className="text-primary" /> {formatDateHeader(dateKey)}
                        </h3>
                    </div>
                    
                    <div className="space-y-4">
                        {groupedTransactions[dateKey].map((transaction) => {
                            const date = transaction.timestamp instanceof Date ? transaction.timestamp : (transaction.timestamp as any)?.toDate?.() || new Date();
                            const isSale = transaction.type === 'sale';
                            const hasCreditRedemption = transaction.creditApplied && transaction.creditApplied > 0;
                            
                            return (
                            <Card key={transaction.id} className="border-none shadow-lg bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-300 group overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-3 rounded-2xl shadow-lg transition-transform group-hover:scale-110",
                                                isSale ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-accent/10 text-accent border border-accent/20"
                                            )}>
                                                {isSale ? <ShoppingBag size={20} /> : <HandCoins size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight text-slate-100">
                                                    {isSale ? (transaction.tabName || 'Venda / Consumo') : 'Pagamento Efetuado'}
                                                </p>
                                                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="opacity-60">{format(date, "HH:mm")}</span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className={cn(hasCreditRedemption && "text-foreground")}>{transaction.paymentMethod || 'N/A'}</span>
                                                    {hasCreditRedemption && (
                                                        <Badge variant="outline" className="text-accent border-accent/40 bg-accent/5 text-[8px] font-black py-0 h-4 rounded-sm flex items-center gap-1">
                                                            + <Wallet size={8} /> SALDO
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black text-lg tracking-tighter",
                                                isSale ? "text-destructive" : "text-accent"
                                            )}>
                                                {isSale ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                                            </p>
                                            <div className="flex flex-col items-end gap-1 mt-1.5">
                                                {isSale && transaction.discount && transaction.discount > 0 ? (
                                                    <Badge variant="destructive" className="text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded-sm">DESC: -R$ {transaction.discount.toFixed(2)}</Badge>
                                                ) : null}
                                                {hasCreditRedemption ? (
                                                    <div className="text-[9px] font-black text-accent uppercase flex items-center gap-1 bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10">
                                                        Resgate: -R$ {transaction.creditApplied?.toFixed(2)}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {isSale && transaction.items && transaction.items.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-border/10 space-y-2">
                                            {transaction.items.map((item, idx) => {
                                                const itemPrice = ('unitPrice' in item ? item.unitPrice : 0);
                                                const isItemCredit = itemPrice < 0;
                                                
                                                return (
                                                    <div key={`${transaction.id}-${idx}`} className="flex justify-between items-center text-[11px] group/item">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-black text-primary min-w-[24px] bg-primary/5 text-center rounded py-0.5">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className={cn(
                                                                "font-bold uppercase tracking-tight transition-colors", 
                                                                isItemCredit ? "text-accent" : "text-muted-foreground group-hover/item:text-slate-200"
                                                            )}>
                                                                {item.name} {('doseName' in item && item.doseName) ? `(${item.doseName})` : ''}
                                                            </span>
                                                        </div>
                                                        <span className={cn("font-black tabular-nums opacity-60", isItemCredit ? "text-accent" : "text-muted-foreground")}>
                                                            R$ {(itemPrice * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                    {!isSale && transaction.description && (
                                        <p className="text-[10px] text-muted-foreground italic mt-2 pl-12 border-l-2 border-accent/20">
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
