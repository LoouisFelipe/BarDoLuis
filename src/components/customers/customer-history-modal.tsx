'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Customer, Transaction } from "@/lib/schemas";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingBag, HandCoins, Calendar, ArrowUpRight, ArrowDownRight, User, Star, Clock, Wallet, Hash, Banknote, CreditCard, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * @fileOverview Modal de Extrato Premium do Cliente (Refatorado UX).
 * CEO: Mudança de "Total Pago" para "Investimento Total" e detalhamento rico de consumo.
 * CTO: Implementação de detalhamento de itens com preços unitários e subtotais.
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
    const totalConsumption = customerTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    
    // Investimento real = Pagamentos diretos + Vendas que não foram no Fiado
    const totalInvested = customerTransactions.reduce((sum, t) => {
        if (t.type === 'payment') return sum + (t.total || 0);
        if (t.type === 'sale' && t.paymentMethod !== 'Fiado') {
            // Se for venda, o investimento real é o total pago menos o crédito resgatado (que já foi investido antes)
            return sum + (t.total || 0) - (t.creditApplied || 0);
        }
        return sum;
    }, 0);

    return { totalConsumption, totalInvested };
  }, [customerTransactions]);

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
    if (isToday(date)) return 'HOJE';
    if (isYesterday(date)) return 'ONTEM';
    return format(date, "dd 'DE' MMMM", { locale: ptBR }).toUpperCase();
  };

  const getPaymentIcon = (method?: string) => {
    if (!method) return <Banknote size={14} />;
    const m = method.toUpperCase();
    if (m.includes('PIX')) return <Receipt size={14} className="text-primary" />;
    if (m.includes('CRÉDITO') || m.includes('CARTÃO')) return <CreditCard size={14} className="text-blue-400" />;
    if (m.includes('SALDO')) return <Wallet size={14} className="text-accent" />;
    return <Banknote size={14} className="text-emerald-400" />;
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
                    <DialogTitle className="text-2xl font-black tracking-tight truncate max-w-[200px] sm:max-w-none uppercase">{customer.name}</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} className="text-primary" /> Histórico de consumo e fidelidade
                    </DialogDescription>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center justify-end gap-1.5 mb-1">
                    {isCredit ? <Wallet size={10} className="text-accent" /> : <Receipt size={10} className="text-yellow-400" />} 
                    {isCredit ? 'SALDO EM CRÉDITO' : 'SALDO DEVEDOR'}
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

        {/* Resumo Financeiro Estratégico */}
        <div className="bg-muted/20 border-b shrink-0 shadow-inner">
            <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-1.5 text-destructive">
                        <ArrowUpRight size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">Consumo Total</span>
                    </div>
                    <p className="text-xl font-black text-foreground">R$ {summary.totalConsumption.toFixed(2)}</p>
                    <ShoppingBag className="absolute -right-2 -bottom-2 h-12 w-12 text-foreground/5 -rotate-12 group-hover:scale-110 transition-transform" />
                </div>
                <div className="bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-1.5 text-accent">
                        <ArrowDownRight size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">Investimento Total</span>
                    </div>
                    <p className="text-xl font-black text-foreground">R$ {summary.totalInvested.toFixed(2)}</p>
                    <Banknote className="absolute -right-2 -bottom-2 h-12 w-12 text-accent/5 -rotate-12 group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* Ranking de Consumo */}
            {topConsumed.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-sm">
                        <h4 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Star size={12} fill="currentColor" /> PREFERIDOS DO CLIENTE (TOP CONSUMO)
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
            <div className="p-4 pb-24">
              {Object.keys(groupedTransactions).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-50 italic text-center gap-4">
                    <div className="p-4 bg-muted/20 rounded-full"><Clock size={48} /></div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={[Object.keys(groupedTransactions)[0]]} className="space-y-4">
                  {Object.keys(groupedTransactions).map((dateKey) => (
                    <AccordionItem key={dateKey} value={dateKey} className="border-none bg-card/30 rounded-2xl overflow-hidden border border-border/10">
                      <AccordionTrigger className="hover:no-underline py-4 px-5 group hover:bg-muted/20 transition-all">
                        <div className="flex items-center gap-3 w-full">
                            <Calendar size={14} className="text-primary group-data-[state=open]:scale-110 transition-transform" />
                            <h3 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                                {formatDateHeader(dateKey)}
                            </h3>
                            <Badge variant="secondary" className="ml-auto text-[9px] font-black bg-slate-800 text-slate-400 border-none px-3">
                                {groupedTransactions[dateKey].length} REGISTROS
                            </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-4 px-4 space-y-3">
                        {groupedTransactions[dateKey].map((transaction) => {
                            const date = transaction.timestamp instanceof Date ? transaction.timestamp : (transaction.timestamp as any)?.toDate?.() || new Date();
                            const isSale = transaction.type === 'sale';
                            const hasCreditRedemption = transaction.creditApplied && transaction.creditApplied > 0;
                            const isManualCredit = transaction.total < 0 && isSale;
                            
                            return (
                            <div key={transaction.id} className="relative p-4 rounded-xl bg-slate-900/60 border border-border/5 group transition-all hover:border-primary/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2.5 rounded-xl shadow-lg transition-transform group-hover:scale-105",
                                            isSale 
                                                ? (isManualCredit ? "bg-accent/10 text-accent border border-accent/20" : "bg-destructive/10 text-destructive border border-destructive/20")
                                                : "bg-accent/10 text-accent border border-accent/20"
                                        )}>
                                            {isSale ? (isManualCredit ? <Wallet size={18} /> : <ShoppingBag size={18} />) : <HandCoins size={18} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] text-muted-foreground font-black">{format(date, "HH:mm")}</span>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
                                                    {getPaymentIcon(transaction.paymentMethod)} {transaction.paymentMethod || 'N/A'}
                                                </span>
                                            </div>
                                            {hasCreditRedemption && (
                                                <Badge variant="outline" className="text-accent border-accent/40 bg-accent/5 text-[8px] font-black py-0 h-4 rounded-sm">
                                                    USO DE CRÉDITO ACUMULADO
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "font-black text-lg tracking-tighter leading-none",
                                            isManualCredit ? "text-accent" : isSale ? "text-destructive" : "text-accent"
                                        )}>
                                            {isSale ? (transaction.total > 0 ? '-' : '+') : '+'} R$ {Math.abs(transaction.total).toFixed(2)}
                                        </p>
                                        {hasCreditRedemption && (
                                            <div className="inline-block text-[8px] font-black text-accent uppercase bg-accent/10 px-2 py-0.5 rounded border border-accent/20 mt-1.5">
                                                RESGATE: -R$ {transaction.creditApplied?.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isSale && transaction.items && transaction.items.length > 0 && (
                                    <div className="mt-2 pt-3 border-t border-white/5 space-y-2">
                                        {transaction.items.map((item, idx) => {
                                            const itemPrice = ('unitPrice' in item ? item.unitPrice : 0);
                                            const isItemCredit = itemPrice < 0;
                                            
                                            return (
                                                <div key={`${transaction.id}-${idx}`} className="flex justify-between items-center group/item">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <span className="font-black text-primary text-[10px] min-w-[24px] h-6 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
                                                            {item.quantity}x
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={cn(
                                                                "text-[11px] font-bold uppercase tracking-tight truncate", 
                                                                isItemCredit ? "text-accent" : "text-foreground group-hover/item:text-primary transition-colors"
                                                            )}>
                                                                {item.name} {('doseName' in item && item.doseName) ? `(${item.doseName})` : ''}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {('identifier' in item && item.identifier) && (
                                                                    <span className="text-[8px] font-black text-orange-500/80 uppercase bg-orange-500/5 px-1.5 rounded flex items-center gap-1">
                                                                        <Hash size={8}/>{item.identifier}
                                                                    </span>
                                                                )}
                                                                <span className="text-[9px] text-muted-foreground/60 font-medium">@ R$ {Math.abs(itemPrice).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={cn("text-[11px] font-black tabular-nums", isItemCredit ? "text-accent" : "text-muted-foreground")}>
                                                        R$ {Math.abs(itemPrice * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {!isSale && transaction.description && (
                                    <p className="text-[10px] text-muted-foreground italic mt-2 pl-10 border-l-2 border-accent/20 leading-relaxed">
                                        &ldquo;{transaction.description}&quot;
                                    </p>
                                )}
                            </div>
                            );
                        })}
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
