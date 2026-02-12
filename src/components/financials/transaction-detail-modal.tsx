'use client';
import React from 'react';
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
    
    if (!transaction) return null;

    const linkedCustomer = transaction.customerId 
        ? customers.find(c => c.id === transaction.customerId)
        : null;

    const getTransactionTitle = () => {
        switch(transaction.type) {
            case 'sale':
                return `Detalhes da Venda: ${transaction.tabName || transaction.description || 'Balcão'}`;
            case 'expense':
                 return `Detalhes da Despesa: ${transaction.description}`;
            case 'payment':
                 return `Detalhes do Pagamento: ${transaction.description}`;
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

    const date = transaction.timestamp instanceof Date 
        ? transaction.timestamp 
        : (transaction.timestamp as any)?.toDate?.() || new Date();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-bold">{getTransactionTitle()}</DialogTitle>
                    <div className="flex flex-wrap gap-3 items-center text-xs text-muted-foreground font-medium uppercase">
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {date.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <Badge variant={getBadgeVariant(transaction.type)} className="text-[10px] py-0 px-2 h-5 font-black uppercase">
                            {transaction.type}
                        </Badge>
                    </div>
                    {linkedCustomer && (
                        <div className="bg-accent/10 border border-accent/20 p-2 rounded-md flex items-center gap-2 mt-2">
                            <User size={14} className="text-accent" />
                            <span className="text-xs font-bold text-accent uppercase">Venda Vinculada: {linkedCustomer.name}</span>
                        </div>
                    )}
                </DialogHeader>

                <div className="mt-6 mb-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Itens da Operação</h4>
                </div>

                <ScrollArea className="max-h-[45vh] pr-4 border rounded-lg bg-muted/10">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="text-[10px] font-bold uppercase">Item</TableHead>
                                <TableHead className="text-center text-[10px] font-bold uppercase">Qtd.</TableHead>
                                <TableHead className="text-right text-[10px] font-bold uppercase">Valor</TableHead>
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
                                            <TableCell className="py-3">
                                                <div className="font-bold text-sm">{name}</div>
                                                {subName && <div className="text-[10px] text-muted-foreground uppercase">{subName}</div>}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{quantity}</TableCell>
                                            <TableCell className="text-right font-bold text-sm">R$ {(price * quantity).toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-xs italic">Esta transação não possui itens detalhados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <DialogFooter className="border-t pt-4 mt-4">
                    <div className="w-full flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Forma de Pagamento</p>
                            <p className="text-sm font-black">{transaction.paymentMethod || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Geral</p>
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
