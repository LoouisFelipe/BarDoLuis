'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ReceiptText, Package, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

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
    if (!reportData) return null;

    const formattedPeriod = date?.from
        ? `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`
        : 'Período Indefinido';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-2xl font-bold">Relatório de Volume de Vendas</DialogTitle>
                    <DialogDescription>
                        Análise de fluxo de pedidos, ticket médio e horários de pico.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow px-6">
                    <div className="space-y-6 pb-10 pt-2">
                        {/* Período Analisado */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Período Analisado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{formattedPeriod}</p>
                            </CardContent>
                        </Card>

                        {/* Métricas de Volume */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">+{reportData.salesCount}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Vendas finalizadas no período.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">R$ {reportData.avgTicket.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Valor médio por pedido.</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gráfico de Horários */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Vendas por Horário</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full">
                                    <SalesByHourChart data={reportData.salesByHourForChart} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
