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
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-card">
          <DialogTitle>Extrato: {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6 space-y-4">
              {customerTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada.</p>
              ) : (
                <div className="space-y-4">
                  {customerTransactions.map((transaction) => {
                    const date = transaction.timestamp instanceof Date ? transaction.timestamp : (transaction.timestamp as any)?.toDate?.() || new Date();
                    return (
                      <div key={transaction.id} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {transaction.type === 'sale' ? 'Venda' : transaction.type === 'payment' ? 'Pagamento/Crédito' : 'Outro'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(date, "PPp", { locale: ptBR })}
                            </p>
                          </div>
                          <div className={`font-bold ${transaction.type === 'sale' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.type === 'sale' ? '-' : '+'} 
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.total)}
                          </div>
                        </div>

                        {transaction.type === 'sale' && transaction.items && (
                          <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside pl-2">
                            {transaction.items.map((item, idx) => (
                              <li key={`${transaction.id}-${idx}`}>
                                {item.quantity}x {item.name}
                              </li>
                            ))}
                          </ul>
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
