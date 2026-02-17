'use client';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { TrendingUp, Target, Receipt, History } from 'lucide-react';
import { TransactionDetailModal } from './transaction-detail-modal';
import { Transaction } from '@/lib/schemas';

interface SalesRevenueReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    periodGoal: number;
    date: DateRange | undefined;
}

export const SalesRevenueReportModal: React.FC<SalesRevenueReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    periodGoal,
    date,
}) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const formattedPeriod = useMemo(() => {
        if (!date?.from) return 'Período Indefinido';
        return `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`;
    }, [date]);

    const salesTransactions = useMemo(() => {
        return reportData?.salesTransactions || [];
    }, [reportData]);

    const topProducts = useMemo(() => {
        return reportData?.topProducts || [];
    }, [reportData]);

    const goalProgress = useMemo(() => {
        return reportData?.goalProgress || 0;
    }, [reportData]);

    if (!reportData) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-4 sm:p-6 border-b bg-card shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg text-accent shrink-0">
                                <Receipt size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-lg sm:text-xl font-bold truncate">Relatório de Vendas</DialogTitle>
                                <DialogDescription className="text-[10px] sm:text-xs truncate">
                                    Análise aprofundada da receita e histórico.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full w-full">
                            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-12">
                                <Card className="bg-muted/20 border-dashed">
                                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
                                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Período Analisado</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                                        <p className="text-base sm:text-lg font-bold">{formattedPeriod}</p>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <Card className="border-l-4 border-l-accent">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                                            <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Receita Bruta</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-accent" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl sm:text-2xl font-black text-accent">R$ {(reportData.totalSalesRevenue || 0).toFixed(2)}</div>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase mt-1">Total das comandas.</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-l-4 border-l-yellow-400">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                                            <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Meta</CardTitle>
                                            <Target className="h-4 w-4 text-yellow-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-xl sm:text-2xl font-black text-yellow-400">R$ {(periodGoal || 0).toFixed(2)}</div>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase mt-1">Atingido: {goalProgress.toFixed(0)}%.</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-3 sm:px-4">
                                        <div className="flex items-center gap-2">
                                            <History size={16} className="text-muted-foreground" />
                                            <CardTitle className="text-xs sm:text-sm font-bold uppercase">Listagem Analítica</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-4">Data/Hora</TableHead>
                                                    <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-4">Cliente/Mesa</TableHead>
                                                    <TableHead className="text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-4">Pgto.</TableHead>
                                                    <TableHead className="text-right text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-4">Valor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesTransactions.length > 0 ? (
                                                    salesTransactions.map((t: Transaction) => {
                                                        const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                                        return (
                                                            <TableRow 
                                                                key={t.id} 
                                                                className="cursor-pointer hover:bg-muted/20"
                                                                onClick={() => setSelectedTransaction(t)}
                                                            >
                                                                <TableCell className="text-[10px] sm:text-[11px] px-2 sm:px-4 whitespace-nowrap">
                                                                    {format(date, 'dd/MM HH:mm')}
                                                                </TableCell>
                                                                <TableCell className="text-[10px] sm:text-[11px] font-bold truncate max-w-[80px] sm:max-w-[150px] px-2 sm:px-4">
                                                                    {t.tabName || t.description || 'Balcão'}
                                                                </TableCell>
                                                                <TableCell className="text-[9px] sm:text-[10px] text-muted-foreground px-2 sm:px-4 whitespace-nowrap">
                                                                    {t.paymentMethod}
                                                                </TableCell>
                                                                <TableCell className="text-right text-[10px] sm:text-xs font-black text-accent px-2 sm:px-4 whitespace-nowrap">
                                                                    R$ {t.total.toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic text-xs">
                                                            Nenhuma venda registrada.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-3 sm:px-4">
                                        <CardTitle className="text-xs sm:text-sm font-bold uppercase">Top Produtos</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {topProducts.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30">
                                                        <TableHead className="text-[10px] font-bold uppercase px-3 sm:px-4">Item</TableHead>
                                                        <TableHead className="text-right text-[10px] font-bold uppercase px-3 sm:px-4">Qtd.</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {topProducts.map((p: any) => (
                                                        <TableRow key={p.name}>
                                                            <TableCell className="text-[10px] sm:text-xs font-medium px-3 sm:px-4">{p.name}</TableCell>
                                                            <TableCell className="text-right text-[10px] sm:text-xs font-bold px-3 sm:px-4">{p.quantity} un.</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted-foreground p-6 text-center text-xs italic">Sem dados de mix.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedTransaction && (
                <TransactionDetailModal 
                    transaction={selectedTransaction} 
                    open={!!selectedTransaction} 
                    onOpenChange={() => setSelectedTransaction(null)} 
                />
            )}
        </>
    );
};
