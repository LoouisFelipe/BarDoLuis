
'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Target, TrendingUp, Landmark, Calculator } from 'lucide-react';

interface GoalReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    date: DateRange | undefined;
}

export const GoalReportModal: React.FC<GoalReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    date,
}) => {
    const formattedPeriod = useMemo(() => {
        if (!date?.from) return 'Período Indefinido';
        return `${format(date.from, 'dd/MM/yyyy')} ${date.to ? `- ${format(date.to, 'dd/MM/yyyy')}` : ''}`;
    }, [date]);

    if (!reportData) return null;

    const { 
        totalSalesRevenue, 
        finalGoal, 
        dailyGoal, 
        totalMonthlyExpenses, 
        goalProgress,
        daysInPeriod
    } = reportData;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[90vh] md:h-auto flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/10 rounded-lg text-yellow-400">
                            <Target size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-bold truncate">Inteligência de Meta Diária</DialogTitle>
                            <DialogDescription className="text-xs truncate">
                                Cálculo do ponto de equilíbrio baseado no rateio de despesas.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full w-full">
                        <div className="p-4 md:p-6 space-y-6 pb-12">
                            <Card className="bg-muted/20 border-dashed">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Período de Análise</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <p className="text-lg font-bold">{formattedPeriod} ({daysInPeriod} dias)</p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-l-4 border-l-yellow-400 bg-yellow-400/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Meta de Sobrevivência</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-yellow-400">R$ {finalGoal.toFixed(2)}</div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Custo operacional para este período.</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-accent bg-accent/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Faturamento Atual</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-accent">R$ {totalSalesRevenue.toFixed(2)}</div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total bruto em vendas e banca.</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-1">Detalhamento do Rateio</h4>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-card border">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Landmark size={18} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">Passivo Mensal Total</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Fixos + Insumos registrados no mês</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-lg">R$ {totalMonthlyExpenses.toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent/10 rounded-lg text-accent"><Calculator size={18} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">Custo Diário Rateado</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Passivo dividido pelos dias do mês</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-lg text-accent">R$ {dailyGoal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
                                        <TrendingUp size={12} /> Saúde Operacional
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black">{goalProgress.toFixed(1)}% Coberto</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Meta: R$ {finalGoal.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border/40">
                                        <div 
                                            className="bg-yellow-400 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.3)]" 
                                            style={{ width: `${Math.min(goalProgress, 100)}%` }} 
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic text-center leading-relaxed">
                                        {goalProgress >= 100 
                                            ? "🚀 EXCELENTE: A operação já se pagou neste período. Todo faturamento extra agora é lucro!"
                                            : `Ainda faltam R$ ${(finalGoal - totalSalesRevenue).toFixed(2)} para cobrir os custos operacionais do período.`}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
