
'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/lib/schemas';

interface TransactionDetailModalProps {
    transaction: Transaction;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, open, onOpenChange }) => {
    if (!transaction) return null;

    const getTransactionTitle = () => {
        switch(transaction.type) {
            case 'sale':
                return `Detalhes da Venda: ${transaction.tabName || transaction.description || ''}`;
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{getTransactionTitle()}</DialogTitle>
                    <DialogDescription>
                        Realizada em {transaction.timestamp instanceof Date ? transaction.timestamp.toLocaleDateString('pt-BR') : 'Data Indisponível'} às {transaction.timestamp instanceof Date ? transaction.timestamp.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4">
                    <Badge variant={getBadgeVariant(transaction.type)} className="capitalize">{transaction.type}</Badge>
                </div>
                <ScrollArea className="max-h-[50vh] pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">Qtd.</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transaction.items && transaction.items.length > 0 ? (
                                transaction.items.map((item: any, index: number) => {
                                    const name = item.name;
                                    const quantity = item.quantity;
                                    const subcategory = item.subcategory || null;
                                    const price = item.unitPrice || item.unitCost || 0;
                                    const key = item.productId || `item-${index}`;

                                    return (
                                        <TableRow key={`${key}-${index}`}>
                                            <TableCell className="font-medium">{name}{subcategory && ` (${subcategory})`}</TableCell>
                                            <TableCell className="text-center">{quantity}</TableCell>
                                            <TableCell className="text-right">R$ {(price * quantity).toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">Esta transação não possui itens detalhados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter className="border-t pt-4 mt-2">
                    <div className="w-full flex justify-between items-center text-lg font-bold">
                        <span>Total da Transação:</span>
                        <span className={transaction.type === 'expense' ? 'text-destructive' : 'text-accent'}>
                             {transaction.type === 'expense' ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                        </span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
