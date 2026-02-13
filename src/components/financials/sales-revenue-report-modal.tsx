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

    // Rules of Hooks: Always call useMemo at the top
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
                    <DialogHeader className="p-6 border-b bg-card shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                <Receipt size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl font-bold truncate">Relatório Detalhado de Vendas</DialogTitle>
                                <DialogDescription className="text-xs truncate">
                                    Análise aprofundada da receita e histórico de comandas.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full w-full">
                            <div className="p-4 md:p-6 space-y-6 pb-12">
                                <Card className="bg-muted/20 border-dashed">
                                    <CardHeader className="py-3 px-4">
                                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Período Analisado</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <p className="text-lg font-bold">{formattedPeriod}</p>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="border-l-4 border-l-accent">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Receita Bruta Total</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-accent" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-black text-accent">R$ {(reportData.totalSalesRevenue || 0).toFixed(2)}</div>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Valor total das comandas no período.</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-l-4 border-l-yellow-400">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Meta do Período</CardTitle>
                                            <Target className="h-4 w-4 text-yellow-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-black text-yellow-400">R$ {(periodGoal || 0).toFixed(2)}</div>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Atingido: {goalProgress.toFixed(0)}% da meta.</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <History size={16} className="text-muted-foreground" />
                                            <CardTitle className="text-sm font-bold uppercase">Listagem de Vendas (Analítico)</CardTitle>
                                        </div>
                                        <CardDescription className="text-[10px] mt-1">Toque em uma venda para ver os itens.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Data/Hora</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Identificação</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Pagamento</TableHead>
                                                    <TableHead className="text-right text-[10px] font-bold uppercase px-4">Valor</TableHead>
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
                                                                <TableCell className="text-[11px] px-4 whitespace-nowrap">
                                                                    {format(date, 'dd/MM HH:mm')}
                                                                </TableCell>
                                                                <TableCell className="text-[11px] font-bold truncate max-w-[100px] px-4">
                                                                    {t.tabName || t.description || 'Balcão'}
                                                                </TableCell>
                                                                <TableCell className="text-[10px] text-muted-foreground px-4">
                                                                    {t.paymentMethod}
                                                                </TableCell>
                                                                <TableCell className="text-right text-xs font-black text-accent px-4">
                                                                    R$ {t.total.toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic text-xs">
                                                            Nenhuma venda registrada neste período.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                        <CardTitle className="text-sm font-bold uppercase">Top 10 Produtos Vendidos</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {topProducts.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30">
                                                        <TableHead className="text-[10px] font-bold uppercase px-4">Produto/Serviço</TableHead>
                                                        <TableHead className="text-right text-[10px] font-bold uppercase px-4">Qtd.</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {topProducts.map((p: any) => (
                                                        <TableRow key={p.name}>
                                                            <TableCell className="text-xs font-medium px-4">{p.name}</TableCell>
                                                            <TableCell className="text-right text-xs font-bold px-4">{p.quantity} un.</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted-foreground p-6 text-center text-xs italic">Sem dados de mix de produtos.</p>
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
