'use client';
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { TrendingDown, PieChart, History, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Transaction } from '@/lib/schemas';
import { TransactionDetailModal } from './transaction-detail-modal';
import { cn } from '@/lib/utils';

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
    // RULES OF HOOKS: All hooks must be at the top level
    const allTransactions = useMemo(() => {
        return reportData?.expenseTransactions || [];
    }, [reportData]);

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredTransactions = useMemo(() => {
        if (!selectedCategory) return allTransactions;
        return allTransactions.filter((t: Transaction) => (t.expenseCategory || 'Geral') === selectedCategory);
    }, [allTransactions, selectedCategory]);

    const formattedPeriod = useMemo(() => {
        if (!date?.from) return 'Período Indefinido';
        return `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`;
    }, [date]);

    if (!reportData) return null;

    const toggleCategoryFilter = (category: string) => {
        setSelectedCategory(prev => prev === category ? null : category);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 border-b bg-card shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                                <TrendingDown size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl font-bold truncate">Relatório de Despesas</DialogTitle>
                                <DialogDescription className="text-xs truncate">
                                    Análise detalhada de todos os custos e gastos.
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
                                    <Card className="border-l-4 border-l-destructive">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total de Despesas</CardTitle>
                                            <TrendingDown className="h-4 w-4 text-destructive" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-black text-destructive">R$ {reportData.totalExpenses.toFixed(2)}</div>
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
                                                    <button 
                                                        key={item.name} 
                                                        onClick={() => toggleCategoryFilter(item.name)}
                                                        className={cn(
                                                            "w-full flex justify-between text-[11px] font-medium p-1 rounded transition-colors hover:bg-muted/50",
                                                            selectedCategory === item.name ? "bg-destructive/10 border border-destructive/20" : "border border-transparent"
                                                        )}
                                                    >
                                                        <span className={cn(selectedCategory === item.name && "font-bold")}>{item.name}</span>
                                                        <span className="text-destructive font-bold">R$ {item.value.toFixed(2)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <History size={16} className="text-muted-foreground" />
                                                <CardTitle className="text-sm font-bold uppercase">Listagem Analítica de Gastos</CardTitle>
                                            </div>
                                            {selectedCategory && (
                                                <Badge variant="secondary" className="flex items-center gap-1 text-[9px] bg-destructive/20 text-destructive border-none">
                                                    Filtrando: {selectedCategory}
                                                    <X size={10} className="cursor-pointer" onClick={() => setSelectedCategory(null)} />
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-[10px] mt-1">Clique em uma despesa para ver detalhes.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Data</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Descrição</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Categoria</TableHead>
                                                    <TableHead className="text-right text-[10px] font-bold uppercase px-4">Valor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTransactions.length > 0 ? (
                                                    filteredTransactions.map((t: Transaction) => {
                                                        const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                                        return (
                                                            <TableRow 
                                                                key={t.id} 
                                                                className="cursor-pointer hover:bg-muted/20"
                                                                onClick={() => setSelectedTransaction(t)}
                                                            >
                                                                <TableCell className="text-[11px] px-4 whitespace-nowrap">{format(date, 'dd/MM')}</TableCell>
                                                                <TableCell className="text-[11px] font-bold truncate max-w-[120px] px-4">{t.description}</TableCell>
                                                                <TableCell className="text-[10px] text-muted-foreground uppercase px-4">{t.expenseCategory || 'Geral'}</TableCell>
                                                                <TableCell className="text-right text-xs font-black text-destructive px-4">R$ {t.total.toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs italic">Nenhuma despesa encontrada com este filtro.</TableCell></TableRow>
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
