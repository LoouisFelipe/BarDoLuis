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
import { HandCoins, CreditCard, History, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { TransactionDetailModal } from './transaction-detail-modal';
import { Transaction } from '@/lib/schemas';
import { cn } from '@/lib/utils';

const CashInflowChart = dynamic(() => import('../dashboard/charts/sales-by-payment-method-chart').then(mod => mod.SalesByPaymentMethodChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> });

interface CashInflowReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    date: DateRange | undefined;
}

export const CashInflowReportModal: React.FC<CashInflowReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    date,
}) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    if (!reportData) return null;

    const formattedPeriod = date?.from
        ? `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`
        : 'Período Indefinido';

    const allInflowTransactions = useMemo(() => {
        const sales = reportData.salesTransactions?.filter((t: any) => t.paymentMethod !== 'Fiado') || [];
        const payments = reportData.paymentTransactions || [];
        return [...sales, ...payments].sort((a, b) => {
            const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
            const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
            return dateB.getTime() - dateA.getTime();
        });
    }, [reportData.salesTransactions, reportData.paymentTransactions]);

    const filteredTransactions = useMemo(() => {
        if (!selectedMethod) return allInflowTransactions;
        return allInflowTransactions.filter((t: Transaction) => t.paymentMethod === selectedMethod);
    }, [allInflowTransactions, selectedMethod]);

    const toggleMethodFilter = (method: string) => {
        setSelectedMethod(prev => prev === method ? null : method);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 border-b bg-card shrink-0">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <HandCoins className="text-sky-400" /> Relatório de Recebimentos (Caixa)
                        </DialogTitle>
                        <DialogDescription>
                            Entradas reais de dinheiro no período selecionado.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-grow overflow-hidden relative">
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
                                    <Card className="border-l-4 border-l-sky-400">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Recebido</CardTitle>
                                            <HandCoins className="h-4 w-4 text-sky-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-black text-sky-400">R$ {reportData.totalCashInflow.toFixed(2)}</div>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1">Dinheiro em mãos ou conta.</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Meios de Pagamento</CardTitle>
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="px-4 py-2 space-y-1">
                                                {reportData.cashInflowByMethodForChart.map((item: any) => (
                                                    <button 
                                                        key={item.name} 
                                                        onClick={() => toggleMethodFilter(item.name)}
                                                        className={cn(
                                                            "w-full flex justify-between text-[11px] font-medium p-1 rounded transition-colors hover:bg-muted/50",
                                                            selectedMethod === item.name ? "bg-sky-400/10 border border-sky-400/20" : "border border-transparent"
                                                        )}
                                                    >
                                                        <span className={cn(selectedMethod === item.name && "font-bold")}>{item.name}</span>
                                                        <span className="text-sky-400 font-bold">R$ {item.value.toFixed(2)}</span>
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
                                                <CardTitle className="text-sm font-bold uppercase">Entradas Detalhadas</CardTitle>
                                            </div>
                                            {selectedMethod && (
                                                <Badge variant="secondary" className="flex items-center gap-1 text-[9px] bg-sky-400/20 text-sky-400 border-none">
                                                    Filtrando: {selectedMethod}
                                                    <X size={10} className="cursor-pointer" onClick={() => setSelectedMethod(null)} />
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-[10px] mt-1">Toque em um recebimento para ver detalhes.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-[10px] font-bold uppercase">Data</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase">Fonte</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase">Método</TableHead>
                                                    <TableHead className="text-right text-[10px] font-bold uppercase">Valor</TableHead>
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
                                                                <TableCell className="text-[11px]">{format(date, 'dd/MM HH:mm')}</TableCell>
                                                                <TableCell className="text-[11px] font-bold truncate max-w-[100px]">{t.tabName || t.description || 'Venda'}</TableCell>
                                                                <TableCell className="text-[10px] text-muted-foreground">{t.paymentMethod}</TableCell>
                                                                <TableCell className="text-right text-xs font-black text-sky-400">R$ {t.total.toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs italic">Nenhum recebimento encontrado com este filtro.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold uppercase">Distribuição por Método</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <CashInflowChart data={reportData.cashInflowByMethodForChart} />
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