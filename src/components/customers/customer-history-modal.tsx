
'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer, Transaction } from "@/lib/schemas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 border-b bg-card shrink-0">
          <DialogTitle className="text-xl font-bold">Extrato: {customer.name}</DialogTitle>
        </DialogHeader>

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
                    return (
                      <div key={transaction.id} className="border-b border-border/50 pb-4 last:border-0 bg-card/30 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">
                              {transaction.type === 'sale' ? 'Venda' : transaction.type === 'payment' ? 'Pagamento/Crédito' : 'Outro'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">
                              {format(date, "PPp", { locale: ptBR })}
                            </p>
                          </div>
                          <div className={`font-black text-lg ${transaction.type === 'sale' ? 'text-destructive' : 'text-accent'}`}>
                            {transaction.type === 'sale' ? '-' : '+'} 
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.total)}
                          </div>
                        </div>

                        {transaction.type === 'sale' && transaction.items && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            <ul className="text-[11px] text-muted-foreground space-y-1">
                                {transaction.items.map((item, idx) => (
                                <li key={`${transaction.id}-${idx}`} className="flex justify-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span className="font-medium">R$ {('unitPrice' in item ? item.unitPrice * item.quantity : 0).toFixed(2)}</span>
                                </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
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
