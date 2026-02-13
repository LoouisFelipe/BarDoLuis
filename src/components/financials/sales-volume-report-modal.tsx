'use client';
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ReceiptText, Package, Clock, History } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Transaction } from '@/lib/schemas';
import { TransactionDetailModal } from './transaction-detail-modal';

const SalesByHourChart = dynamic(() => import('../dashboard/charts/sales-by-hour-chart').then(mod => mod.SalesByHourChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> });

interface SalesVolumeReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    date: DateRange | undefined;
}

export const SalesVolumeReportModal: React.FC<SalesVolumeReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    date,
}) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Rules of Hooks: Always at top
    const formattedPeriod = useMemo(() => {
        if (!date?.from) return 'Período Indefinido';
        return `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`;
    }, [date]);

    const salesTransactions = useMemo(() => {
        return reportData?.salesTransactions || [];
    }, [reportData]);

    if (!reportData) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 border-b bg-card shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <ReceiptText size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl font-bold truncate">Relatório de Volume de Vendas</DialogTitle>
                                <DialogDescription className="text-xs truncate">
                                    Análise de fluxo, ticket médio e comportamento horário.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden">
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
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total de Pedidos</CardTitle>
                                            <ReceiptText className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-black">+{reportData.salesCount}</div>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1">Comandas fechadas no período.</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Ticket Médio</CardTitle>
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-black">R$ {reportData.avgTicket.toFixed(2)}</div>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1">Valor médio por comanda.</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-muted-foreground" />
                                            <CardTitle className="text-sm font-bold uppercase">Volume por Horário</CardTitle>
                                        </div>
                                        <CardDescription className="text-[10px] mt-1">Identifique os horários de pico operacional.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="h-[350px] w-full">
                                            <SalesByHourChart data={reportData.salesByHourForChart} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <History size={16} className="text-muted-foreground" />
                                            <CardTitle className="text-sm font-bold uppercase">Histórico de Movimento</CardTitle>
                                        </div>
                                        <CardDescription className="text-[10px] mt-1">Clique para ver itens de cada atendimento.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Hora</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase px-4">Atendimento</TableHead>
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
                                                                <TableCell className="text-[11px] px-4 whitespace-nowrap">{format(date, 'HH:mm')}</TableCell>
                                                                <TableCell className="text-[11px] font-bold truncate max-w-[150px] px-4">{t.tabName || t.description || 'Balcão'}</TableCell>
                                                                <TableCell className="text-right text-xs font-black px-4">R$ {t.total.toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground text-xs italic">Nenhum movimento no período.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
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
