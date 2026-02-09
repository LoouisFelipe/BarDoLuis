'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { TrendingUp, Target, Package } from 'lucide-react';

interface SalesRevenueReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any; // Considerar tipagem mais estrita para reportData em um projeto maior
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
    if (!reportData) return null;

    const formattedPeriod = date?.from
        ? `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`
        : 'Período Indefinido';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Relatório Detalhado de Receita de Vendas</DialogTitle>
                    <DialogDescription>
                        Análise aprofundada da receita de vendas, produtos mais vendidos e progresso da meta para o período.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow pr-4 -mx-2 px-2">
                    <div className="space-y-6 py-4">
                        {/* Período Analisado */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Período Analisado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{formattedPeriod}</p>
                            </CardContent>
                        </Card>

                        {/* Receita Bruta Total */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Receita Bruta Total</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-accent">R$ {reportData.totalSalesRevenue.toFixed(2)}</div>
                                <p className="text-sm text-muted-foreground">Valor total das vendas no período.</p>
                            </CardContent>
                        </Card>

                        {/* Comparativo com Metas */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Meta de Vendas do Período</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-yellow-400">R$ {periodGoal.toFixed(2)}</div>
                                <p className="text-sm text-muted-foreground">Atingido: {reportData.goalProgress.toFixed(0)}% da meta.</p>
                            </CardContent>
                        </Card>

                        {/* Produtos/Serviços Mais Vendidos */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 10 Produtos/Serviços Mais Vendidos</CardTitle>
                                <CardDescription>Por quantidade vendida no período.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reportData.topProducts && reportData.topProducts.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produto/Serviço</TableHead>
                                                <TableHead className="text-right">Quantidade</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.topProducts.map((p: any) => (
                                                <TableRow key={p.name}>
                                                    <TableCell className="font-medium">{p.name}</TableCell>
                                                    <TableCell className="text-right">{p.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground">Nenhum produto/serviço vendido neste período.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};