'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Target, Banknote } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const ProfitByProductChart = dynamic(() => import('../dashboard/charts/profit-by-product-chart').then(mod => mod.ProfitByProductChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> });

interface ProfitReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    date: DateRange | undefined;
}

export const ProfitReportModal: React.FC<ProfitReportModalProps> = ({
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
                    <DialogTitle className="text-2xl font-bold">Relatório de Lucratividade</DialogTitle>
                    <DialogDescription>
                        Análise de lucro bruto, lucro líquido e desempenho por produto.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow px-6">
                    <div className="space-y-6 pb-10 pt-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Período Analisado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{formattedPeriod}</p>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-l-4 border-l-primary">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                                    <Target className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-primary">R$ {reportData.netProfit.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">(Lucro Bruto - Despesas)</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-accent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
                                    <Banknote className="h-4 w-4 text-accent" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-accent">R$ {reportData.grossProfit.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">(Vendas - Custo de Mercadoria)</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Top 10 Produtos por Lucro Bruto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ProfitByProductChart data={reportData.profitByProduct} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};