'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { TrendingDown, PieChart } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const ExpensesChart = dynamic(() => import('../dashboard/charts/sales-by-payment-method-chart').then(mod => mod.SalesByPaymentMethodChart), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><Spinner/></div> });

interface ExpensesReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: {
        totalExpenses: number;
        expensesByCategoryForChart: { name: string; value: number }[];
    };
    date: DateRange | undefined;
}

export const ExpensesReportModal: React.FC<ExpensesReportModalProps> = ({
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
                    <DialogTitle className="text-2xl font-bold">Relatório de Despesas</DialogTitle>
                    <DialogDescription>
                        Detalhamento dos gastos por categoria no período.
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
                                    <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-destructive">R$ {reportData.totalExpenses.toFixed(2)}</div>
                                    <p className="text-sm text-muted-foreground">Soma de todas as saídas registradas como despesa.</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                                    <PieChart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="p-0">
                                     <ScrollArea className="h-48 px-6 py-4">
                                        <ul className="space-y-2">
                                            {reportData.expensesByCategoryForChart.map((item) => (
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
                                <CardTitle>Distribuição por Categoria</CardTitle>
                                <CardDescription>Visualização gráfica das despesas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportData.expensesByCategoryForChart && reportData.expensesByCategoryForChart.length > 0 ? (
                                    <div className="h-[400px] w-full">
                                        <ExpensesChart data={reportData.expensesByCategoryForChart} />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Nenhuma despesa registrada neste período.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};