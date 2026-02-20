
'use client';
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { TrendingUp, Target, Receipt, History, PieChart, X } from 'lucide-react';
import { Transaction } from '@/lib/schemas';
import { Spinner } from '@/components/ui/spinner';
import { TransactionDetailModal } from './transaction-detail-modal';
import { cn } from '@/lib/utils';

const SalesByPaymentMethodChart = dynamic(() => import('../dashboard/charts/sales-by-payment-method-chart').then(mod => mod.SalesByPaymentMethodChart), { 
    ssr: false, 
    loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> 
});

interface SalesRevenueReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    periodGoal: number;
    date: DateRange | undefined;
}

/**
 * @fileOverview Relatório de Vendas Premium.
 * CTO: Saneamento de tipagem para métodos de pagamento e filtros.
 */
export const SalesRevenueReportModal: React.FC<SalesRevenueReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    periodGoal,
    date,
}) => {
    // RULES OF HOOKS: All hooks at top level
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    const formattedPeriod = useMemo(() => {
        if (!date?.from) return 'Período Indefinido';
        return `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`;
    }, [date]);

    const allSales = useMemo(() => {
        return (reportData?.salesTransactions as Transaction[]) || [];
    }, [reportData]);

    const filteredSales = useMemo(() => {
        if (!selectedMethod) return allSales;
        return allSales.filter((t: Transaction) => t.paymentMethod === selectedMethod);
    }, [allSales, selectedMethod]);

    const paymentMethods = useMemo<string[]>(() => {
        const methods = new Set(allSales.map((t: Transaction) => t.paymentMethod).filter(Boolean) as string[]);
        return Array.from(methods).sort();
    }, [allSales]);

    if (!reportData) return null;

    const goalProgress = reportData?.goalProgress || 0;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-none md:border-solid">
                    <DialogHeader className="p-4 sm:p-6 border-b bg-card shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-xl text-accent shrink-0 border border-accent/20">
                                <Receipt size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight truncate">Relatório de Vendas</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest truncate">
                                    Inteligência de Receita &bull; BarDoLuis
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full w-full">
                            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24">
                                <Card className="bg-muted/20 border-dashed border-2">
                                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
                                        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Período de Análise</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                                        <p className="text-base sm:text-lg font-black text-foreground">{formattedPeriod}</p>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <Card className="border-l-4 border-l-accent shadow-lg bg-card/50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                                            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Receita Bruta</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-accent" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl sm:text-3xl font-black text-accent">R$ {(reportData.totalSalesRevenue || 0).toFixed(2)}</div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter">Faturamento total em comandas.</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-l-4 border-l-yellow-400 shadow-lg bg-card/50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                                            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Atingimento da Meta</CardTitle>
                                            <Target className="h-4 w-4 text-yellow-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl sm:text-3xl font-black text-yellow-400">{(goalProgress || 0).toFixed(0)}%</div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter">Alvo do período: R$ {(periodGoal || 0).toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="shadow-lg border-none">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <PieChart size={18} className="text-primary" />
                                            <CardTitle className="text-sm font-black uppercase tracking-widest">Share por Pagamento</CardTitle>
                                        </div>
                                        <CardDescription className="text-[10px]">Distribuição percentual do faturamento.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <SalesByPaymentMethodChart data={reportData.salesByPaymentMethodForChart || []} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-lg border-none">
                                    <CardHeader className="border-b bg-muted/10 py-3 px-3 sm:px-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <History size={16} className="text-primary" />
                                                <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-widest">Detalhamento Analítico</CardTitle>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1.5">
                                                {paymentMethods.map((method: string) => (
                                                    <Badge 
                                                        key={method}
                                                        variant={selectedMethod === method ? "default" : "outline"}
                                                        className={cn(
                                                            "cursor-pointer text-[9px] font-black uppercase py-1 transition-all",
                                                            selectedMethod === method ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "hover:bg-muted"
                                                        )}
                                                        onClick={() => setSelectedMethod(selectedMethod === method ? null : method)}
                                                    >
                                                        {method}
                                                    </Badge>
                                                ))}
                                                {selectedMethod && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-[9px] font-black uppercase py-1 text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                                                        onClick={() => setSelectedMethod(null)}
                                                    >
                                                        <X size={10} className="mr-1" /> Limpar
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto scrollbar-hide">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30 border-b-2">
                                                        <TableHead className="text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-4 text-muted-foreground">Hora</TableHead>
                                                        <TableHead className="text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-4 text-muted-foreground">Mesa / Fiel</TableHead>
                                                        <TableHead className="text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-4 text-muted-foreground">Pagamento</TableHead>
                                                        <TableHead className="text-right text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-4 text-muted-foreground">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredSales.length > 0 ? (
                                                        filteredSales.map((t: Transaction) => {
                                                            const dateValue = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                                            return (
                                                                <TableRow 
                                                                    key={t.id} 
                                                                    className="cursor-pointer hover:bg-primary/5 border-b border-border/50"
                                                                    onClick={() => setSelectedTransaction(t)}
                                                                >
                                                                    <TableCell className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-4 whitespace-nowrap">
                                                                        {format(dateValue, 'dd/MM HH:mm')}
                                                                    </TableCell>
                                                                    <TableCell className="text-[10px] sm:text-[11px] font-black truncate max-w-[80px] sm:max-w-[150px] px-2 sm:px-4">
                                                                        {t.tabName || t.description || 'Balcão'}
                                                                    </TableCell>
                                                                    <TableCell className="px-2 sm:px-4">
                                                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-muted-foreground">
                                                                            {t.paymentMethod}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className={cn(
                                                                        "text-right text-[10px] sm:text-xs font-black px-2 sm:px-4 whitespace-nowrap",
                                                                        t.paymentMethod === 'Fiado' ? "text-yellow-400" : "text-accent"
                                                                    )}>
                                                                        R$ {t.total.toFixed(2)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center py-16 text-muted-foreground font-bold text-xs uppercase opacity-50">
                                                                Nenhuma venda encontrada com este filtro.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
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
