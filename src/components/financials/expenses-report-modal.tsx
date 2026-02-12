'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { TrendingDown, PieChart, History, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Transaction } from '@/lib/schemas';
import { TransactionDetailModal } from './transaction-detail-modal';

const ExpensesChart = dynamic(() => import('../dashboard/charts/sales-by-payment-method-chart').then(mod => mod.SalesByPaymentMethodChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> });

interface ExpensesReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    date: DateRange | undefined;
}

export const ExpensesReportModal: React.FC<ExpensesReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    date,
}) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    if (!reportData) return null;

    const formattedPeriod = date?.from
        ? `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`
        : 'Período Indefinido';

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b bg-card shrink-0">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <TrendingDown className="text-destructive" /> Relatório de Despesas
                        </DialogTitle>
                        <DialogDescription>
                            Análise detalhada de todos os custos e gastos do período.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <div className="p-6 space-y-6 pb-12">
                                <Card className="bg-muted/20 border-dashed">
                                    <CardHeader className="py-3 px-4">
                                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Período Analisado</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <p className="text-xl font-bold">{formattedPeriod}</p>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="border-l-4 border-l-destructive">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total de Despesas</CardTitle>
                                            <TrendingDown className="h-4 w-4 text-destructive" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-black text-destructive">R$ {reportData.totalExpenses.toFixed(2)}</div>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1">Impacto direto no lucro líquido.</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Por Categoria</CardTitle>
                                            <PieChart className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="px-4 py-2 space-y-1">
                                                {reportData.expensesByCategoryForChart.map((item: any) => (
                                                    <div key={item.name} className="flex justify-between text-[11px] font-medium">
                                                        <span>{item.name}</span>
                                                        <span className="text-destructive font-bold">R$ {item.value.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <History size={16} className="text-muted-foreground" />
                                            <CardTitle className="text-sm font-bold uppercase">Listagem Analítica de Gastos</CardTitle>
                                        </div>
                                        <CardDescription className="text-[10px]">Clique em uma despesa para ver detalhes.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-[10px] font-bold uppercase">Data</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase">Descrição</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase">Categoria</TableHead>
                                                    <TableHead className="text-right text-[10px] font-bold uppercase">Valor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportData.expenseTransactions && reportData.expenseTransactions.length > 0 ? (
                                                    reportData.expenseTransactions.map((t: Transaction) => {
                                                        const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                                        return (
                                                            <TableRow 
                                                                key={t.id} 
                                                                className="cursor-pointer hover:bg-muted/20"
                                                                onClick={() => setSelectedTransaction(t)}
                                                            >
                                                                <TableCell className="text-[11px]">{format(date, 'dd/MM')}</TableCell>
                                                                <TableCell className="text-[11px] font-bold truncate max-w-[120px]">{t.description}</TableCell>
                                                                <TableCell className="text-[10px] text-muted-foreground uppercase">{t.expenseCategory || 'Geral'}</TableCell>
                                                                <TableCell className="text-right text-xs font-black text-destructive">R$ {t.total.toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs italic">Nenhuma despesa no período.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold uppercase">Distribuição de Custos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[350px] w-full">
                                            <ExpensesChart data={reportData.expensesByCategoryForChart} />
                                        </div>
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