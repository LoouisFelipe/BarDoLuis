'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { HandCoins, CreditCard } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const CashInflowChart = dynamic(() => import('../dashboard/charts/sales-by-payment-method-chart').then(mod => mod.SalesByPaymentMethodChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> });

interface CashInflowReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: {
        totalCashInflow: number;
        cashInflowByMethodForChart: { name: string; value: number }[];
    };
    date: DateRange | undefined;
}

export const CashInflowReportModal: React.FC<CashInflowReportModalProps> = ({
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
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Relatório de Recebimentos (Caixa)</DialogTitle>
                    <DialogDescription>
                        Detalhamento das entradas financeiras no período (Vendas e Recebimentos de Dívidas).
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow pr-6 -mx-6 px-6">
                    <div className="space-y-6 py-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Período Analisado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl font-semibold">{formattedPeriod}</p>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-sky-400">R$ {reportData.totalCashInflow.toFixed(2)}</div>
                                    <p className="text-sm text-muted-foreground">Soma de vendas (exceto fiado) e pagamentos de dívidas.</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Composição</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="p-0">
                                     <ScrollArea className="h-48 px-6 py-4">
                                        <ul className="space-y-2">
                                            {reportData.cashInflowByMethodForChart.map((item) => (
                                                <li key={item.name} className="flex justify-between text-sm">
                                                    <span>{item.name}</span>
                                                    <span className="font-bold">R$ {item.value.toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                     </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Distribuição por Forma de Pagamento</CardTitle>
                                <CardDescription>Visualização gráfica das entradas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportData.cashInflowByMethodForChart && reportData.cashInflowByMethodForChart.length > 0 ? (
                                    <div className="h-[400px] w-full">
                                        <CashInflowChart data={reportData.cashInflowByMethodForChart} />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Nenhum recebimento registrado neste período.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};