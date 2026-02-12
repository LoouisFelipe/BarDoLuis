'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Target, Banknote, Scale, TrendingUp } from 'lucide-react';
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
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b bg-card shrink-0">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Scale className="text-primary" /> Relatório de Lucratividade
                    </DialogTitle>
                    <DialogDescription>
                        Análise de eficiência operacional e margens de lucro.
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
                                <Card className="border-l-4 border-l-primary">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Lucro Líquido</CardTitle>
                                        <Target className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-primary">R$ {reportData.netProfit.toFixed(2)}</div>
                                        <p className="text-[10px] text-muted-foreground uppercase mt-1">O que sobra após todas as contas.</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-accent">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Lucro Bruto</CardTitle>
                                        <Banknote className="h-4 w-4 text-accent" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-accent">R$ {reportData.grossProfit.toFixed(2)}</div>
                                        <p className="text-[10px] text-muted-foreground uppercase mt-1">Vendas menos custos de mercadoria.</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="border-b bg-muted/10 py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-muted-foreground" />
                                        <CardTitle className="text-sm font-bold uppercase">Performance de Mix de Produtos</CardTitle>
                                    </div>
                                    <CardDescription className="text-[10px]">Top 10 produtos que mais geram lucro bruto.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="h-[400px] w-full">
                                        <ProfitByProductChart data={reportData.profitByProduct} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase">Fórmula de Cálculo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-xs font-medium text-muted-foreground">
                                        <p>• <span className="text-foreground">Lucro Bruto</span> = Receita Total - Custo de Mercadoria Vendida (COGS)</p>
                                        <p>• <span className="text-foreground">Lucro Líquido</span> = Lucro Bruto - Despesas Operacionais</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};