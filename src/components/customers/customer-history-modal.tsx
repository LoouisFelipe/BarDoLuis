'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer, Transaction } from "@/lib/schemas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerHistoryModal = ({ customer, transactions, open, onOpenChange }: CustomerHistoryModalProps) => {
  // Filtra apenas as transações deste cliente
  const customerTransactions = transactions
    .filter(t => t.customerId === customer.id)
    .sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
        const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extrato: {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {customerTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada.</p>
          ) : (
            <div className="space-y-4">
              {customerTransactions.map((transaction) => (
                <div key={transaction.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'sale' ? 'Venda' : 'Pagamento/Crédito'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          transaction.timestamp instanceof Date ? transaction.timestamp : (transaction.timestamp as any)?.toDate?.() || new Date(),
                          "PPp",
                          { locale: ptBR }
                        )}
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
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
