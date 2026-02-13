'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Transaction, OrderItem, PurchaseItem } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { User, Calendar, Clock } from 'lucide-react';

interface TransactionDetailModalProps {
    transaction: Transaction;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, open, onOpenChange }) => {
    const { customers } = useData();
    
    const linkedCustomer = useMemo(() => {
        if (!transaction?.customerId) return null;
        return customers.find(c => c.id === transaction.customerId);
    }, [transaction, customers]);

    const date = useMemo(() => {
        if (!transaction?.timestamp) return new Date();
        return transaction.timestamp instanceof Date 
            ? transaction.timestamp 
            : (transaction.timestamp as any)?.toDate?.() || new Date();
    }, [transaction]);

    if (!transaction) return null;

    const getTransactionTitle = () => {
        switch(transaction.type) {
            case 'sale':
                return `Venda: ${transaction.tabName || transaction.description || 'Balcão'}`;
            case 'expense':
                 return `Despesa: ${transaction.description}`;
            case 'payment':
                 return `Pagamento: ${transaction.description}`;
            default:
                return "Detalhes da Transação";
        }
    }
    
    const getBadgeVariant = (type: 'sale' | 'expense' | 'payment') => {
        switch(type) {
            case 'sale': return 'default';
            case 'expense': return 'destructive';
            case 'payment': return 'secondary';
            default: return 'outline';
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg h-[90vh] md:h-auto flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b bg-card shrink-0">
                    <DialogTitle className="text-xl font-bold">{getTransactionTitle()}</DialogTitle>
                    <DialogDescription className="hidden">Detalhes completos da transação financeira.</DialogDescription>
                    <div className="flex flex-wrap gap-3 items-center text-[10px] text-muted-foreground font-bold uppercase mt-2">
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {date.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <Badge variant={getBadgeVariant(transaction.type)} className="text-[9px] py-0 px-2 h-5 font-black uppercase">
                            {transaction.type}
                        </Badge>
                    </div>
                    {linkedCustomer && (
                        <div className="bg-accent/10 border border-accent/20 p-2 rounded-md flex items-center gap-2 mt-3">
                            <User size={14} className="text-accent" />
                            <span className="text-[10px] font-bold text-accent uppercase">Vínculo: {linkedCustomer.name}</span>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-4">
                    <div className="mb-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Itens da Operação</h4>
                    </div>

                    <ScrollArea className="h-[40vh] md:max-h-[45vh] border rounded-lg bg-muted/10">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="text-[10px] font-bold uppercase px-4">Item</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold uppercase px-4">Qtd.</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold uppercase px-4">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transaction.items && transaction.items.length > 0 ? (
                                    transaction.items.map((item, index) => {
                                        const isOrderItem = 'unitPrice' in item;
                                        const name = item.name;
                                        const quantity = item.quantity;
                                        const price = isOrderItem ? (item as OrderItem).unitPrice : (item as PurchaseItem).unitCost;
                                        const subName = isOrderItem && (item as OrderItem).doseName ? ` (${(item as OrderItem).doseName})` : '';
                                        const itemId = isOrderItem && (item as OrderItem).productId ? (item as OrderItem).productId : `item-${index}`;

                                        return (
                                            <TableRow key={`${itemId}-${index}`} className="hover:bg-transparent">
                                                <TableCell className="py-3 px-4">
                                                    <div className="font-bold text-sm leading-tight">{name}</div>
                                                    {subName && <div className="text-[10px] text-muted-foreground uppercase">{subName}</div>}
                                                </TableCell>
                                                <TableCell className="text-center font-medium px-4">{quantity}</TableCell>
                                                <TableCell className="text-right font-bold text-sm px-4 whitespace-nowrap">R$ {(price * quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground text-xs italic">Esta transação não possui itens detalhados.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <DialogFooter className="border-t p-6 bg-muted/20 shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <div className="min-w-0 pr-4">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pagamento</p>
                            <p className="text-sm font-black truncate">{transaction.paymentMethod || 'N/A'}</p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Geral</p>
                            <p className={`text-2xl font-black ${transaction.type === 'expense' ? 'text-destructive' : 'text-accent'}`}>
                                {transaction.type === 'expense' ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
