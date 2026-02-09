
'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Landmark, CheckCircle, HandCoins } from 'lucide-react';
import { Customer, Transaction } from '@/lib/schemas';

interface CustomerHistoryModalProps {
    customer: Customer;
    transactions: Transaction[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({ customer, transactions, open, onOpenChange }) => {
    // In a real app, transactions would be fetched or passed in.
    // For this template, we'll use the mock data passed in or an empty array.
    const customerTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions
            .filter(t => t.customerId === customer.id && (t.type === 'sale' || t.type === 'payment'))
            .sort((a, b) => (b.timestamp as Date).getTime() - (a.timestamp as Date).getTime());
    }, [customer.id, transactions]);

    const getPaymentBadge = (transaction: Transaction) => {
        const method = transaction.paymentMethod || 'N/A';
        
        if (transaction.type === 'payment') {
            return <Badge variant="default" className="bg-accent hover:bg-accent/80"><CheckCircle className="mr-1 h-3 w-3" /> Pagamento de Dívida ({method})</Badge>;
        }

        switch (method) {
            case 'Fiado':
                return <Badge variant="destructive" className="bg-yellow-400 text-background hover:bg-yellow-400/90"><HandCoins className="mr-1 h-3 w-3" /> Adicionado ao Fiado</Badge>;
            case 'PIX':
                return <Badge variant="secondary"><Landmark className="mr-1 h-3 w-3" /> PIX</Badge>;
            case 'Crédito':
            case 'Débito':
                return <Badge variant="secondary"><CreditCard className="mr-1 h-3 w-3" /> {method}</Badge>;
            default:
                return <Badge variant="secondary">{method}</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Extrato do Cliente: {customer.name}</DialogTitle>
                    <DialogDescription>Um histórico completo de todas as transações e pagamentos.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4 -mx-2 px-2">
                    {customerTransactions.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-center">Nenhuma transação registrada para este cliente.</p>
                    ) : (
                        <ul className="space-y-3">
                            {customerTransactions.map(transaction => (
                                <li key={transaction.id} className="bg-secondary p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-muted-foreground">{(transaction.timestamp as Date).toLocaleDateString('pt-BR')} às {(transaction.timestamp as Date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                            {getPaymentBadge(transaction)}
                                        </div>
                                        <span className={`font-bold text-lg ${transaction.type === 'payment' ? 'text-accent' : (transaction.paymentMethod === 'Fiado' ? 'text-yellow-400' : 'text-primary')}`}>
                                            R$ {transaction.total.toFixed(2)}
                                        </span>
                                    </div>
                                    {transaction.type === 'sale' && (
                                        <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside pl-2">
                                            {transaction.items.map((item, idx) => <li key={`${transaction.id}-${item.identifier}-${idx}`}>{item.quantity}x {item.name} {item.subcategory && `(${item.subcategory})`}</li>)}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
