
'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns'; 
import { BarChart2, TrendingDown, TrendingUp, ReceiptText, Target, HandCoins, Edit, Info, ArrowUpRight, ArrowDownRight, Minus, Package } from 'lucide-react'; 
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SalesRevenueReportModal } from '@/components/financials/sales-revenue-report-modal';
import { CashInflowReportModal } from '@/components/financials/cash-inflow-report-modal';
import { ExpensesReportModal } from '@/components/financials/expenses-report-modal';
import { useReportData } from '@/hooks/use-report-data';
import { CockpitSkeleton } from '../CockpitSkeleton';
import { Spinner } from '@/components/ui/spinner';

const ChartSkeleton = () => <div className="h-[350px] w-full flex items-center justify-center bg-muted/50 rounded-lg"><Spinner/></div>;
const TopProductsChart = dynamic(() => import('../charts/top-products-chart').then(mod => mod.TopProductsChart), { ssr: false, loading: ChartSkeleton });
const ProfitByProductChart = dynamic(() => import('../charts/profit-by-product-chart').then(mod => mod.ProfitByProductChart), { ssr: false, loading: ChartSkeleton });
const SalesByPaymentMethodChart = dynamic(() => import('../charts/sales-by-payment-method-chart').then(mod => mod.SalesByPaymentMethodChart), { ssr: false, loading: ChartSkeleton });
const SalesHeatmapChart = dynamic(() => import('../charts/sales-heatmap-chart').then(mod => mod.SalesHeatmapChart), { ssr: false, loading: ChartSkeleton });

const TrendIndicator = ({ value, inverse = false }: { value: number | undefined, inverse?: boolean }) => {
    const val = value || 0;
    if (Math.abs(val) < 0.1) return <span className="text-xs text-muted-foreground ml-2 flex items-center"><Minus className="w-3 h-3 mr-1"/> 0%</span>;
    const isPositive = val > 0;
    const isGood = inverse ? !isPositive : isPositive;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isGood ? "text-green-500" : "text-red-500";
    return (
        <span className={`text-xs font-medium flex items-center ml-2 ${colorClass}`}>
            <Icon className="w-3 h-3 mr-1" />{Math.abs(val).toFixed(1)}%
        </span>
    );
};

interface CockpitTabProps {
    onTabChange?: (tab: string) => void;
}

export const CockpitTab: React.FC<CockpitTabProps> = ({ onTabChange }) => {
    const { transactions, products, customers, loading } = useData();
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));
    
    const [manualGoal, setManualGoal] = useState(0);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    
    const [isSalesRevenueModalOpen, setIsSalesRevenueModalOpen] = useState(false);
    const [isCashInflowModalOpen, setIsCashInflowModalOpen] = useState(false);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);

    const reportData = useReportData({
        transactions,
        products,
        customers,
        date: dateRange,
        periodGoal: manualGoal,
    });

    if (loading || !reportData) {
        return <CockpitSkeleton />;
    }
    
    return (
        <TooltipProvider>
        <div className="p-1 md:p-4 space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-foreground flex items-center"><BarChart2 className="mr-3" /> Cockpit de B.I.</h2>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors border-l-4 border-l-accent" onClick={() => setIsSalesRevenueModalOpen(true)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita de Vendas</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline"><div className="text-2xl font-bold text-accent">R$ {(reportData.totalSalesRevenue || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.revenue} /></div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors border-l-4 border-l-sky-400" onClick={() => setIsCashInflowModalOpen(true)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Recebimentos (Caixa)</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground"/></CardHeader>
                    <CardContent><div className="flex items-baseline"><div className="text-2xl font-bold text-sky-400">R$ {(reportData.totalCashInflow || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.cashInflow} /></div></CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-400 relative overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meta do Período</CardTitle>
                        <div className="flex items-center gap-1">
                            {isEditingGoal ? (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(false)} className="text-[10px] h-6 px-2">Salvar</Button>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingGoal(true)}>
                                            <Edit className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Definir Meta Manual</p></TooltipContent>
                                </Tooltip>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-[10px]">
                                    <p>Baseada no Ponto de Equilíbrio:</p>
                                    <p className="font-bold">(Custos Mês / Dias Mês) * Dias do Filtro</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isEditingGoal ? (
                            <Input
                                type="number"
                                value={manualGoal}
                                onChange={(e) => setManualGoal(Number(e.target.value))}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditingGoal(false); }}
                                onBlur={() => setIsEditingGoal(false)}
                                className="h-8 text-2xl font-bold text-yellow-400 p-1 bg-transparent border-none"
                                autoFocus
                            />
                        ) : (
                            <div className="text-2xl font-bold text-yellow-400">R$ {(reportData.finalGoal || 0).toFixed(2)}</div>
                        )}
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                            {manualGoal > 0 ? 'Meta Manual' : 'Meta de Custo (Eq.)'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                             <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                <div 
                                    className="bg-yellow-400 h-full transition-all duration-500" 
                                    style={{ width: `${Math.min(reportData.goalProgress || 0, 100)}%` }}
                                />
                             </div>
                             <span className="text-[10px] font-bold ml-2">{(reportData.goalProgress || 0).toFixed(0)}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors border-l-4 border-l-primary" onClick={() => onTabChange?.('financials')}>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle><Target className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-bold text-primary">R$ {(reportData.netProfit || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.netProfit} /></div></CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors border-l-4 border-l-destructive" onClick={() => setIsExpensesModalOpen(true)}> 
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Despesas</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-bold text-destructive">R$ {(reportData.totalExpenses || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.expenses} inverse /></div></CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors"> 
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-bold">R$ {(reportData.grossProfit || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.grossProfit} /></div></CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => onTabChange?.('daily')}> 
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Vendas</CardTitle><ReceiptText className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-bold">+{reportData.salesCount || 0}</div><TrendIndicator value={reportData.deltas?.salesCount} /></div></CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-secondary/50 transition-colors"> 
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ticket Médio</CardTitle><Package className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-bold">R$ {(reportData.avgTicket || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.avgTicket} /></div></CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top 10 Produtos Mais Vendidos</CardTitle><CardDescription>por quantidade vendida no período.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                           <TopProductsChart data={reportData.topProducts || []} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Top 10 Produtos por Lucro Bruto</CardTitle><CardDescription>por lucro bruto gerado no período.</CardDescription></CardHeader>
                  <CardContent>
                       <div className="h-[350px] w-full">
                        <ProfitByProductChart data={reportData.profitByProduct || []} />
                       </div>
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Horários de Pico de Vendas</CardTitle><CardDescription>Mapa de calor de vendas por dia da semana e hora.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                           <SalesHeatmapChart data={reportData.salesHeatmapData || []} />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Receita por Forma de Pagamento</CardTitle><CardDescription>Distribuição da receita total por método de pagamento.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <SalesByPaymentMethodChart data={reportData.salesByPaymentMethodForChart || []} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <SalesRevenueReportModal
                open={isSalesRevenueModalOpen}
                onOpenChange={setIsSalesRevenueModalOpen}
                reportData={reportData}
                periodGoal={reportData.finalGoal}
                date={dateRange}
            />
            <CashInflowReportModal
                open={isCashInflowModalOpen}
                onOpenChange={setIsCashInflowModalOpen}
                reportData={reportData}
                date={dateRange}
            />
            <ExpensesReportModal
                open={isExpensesModalOpen}
                onOpenChange={setIsExpensesModalOpen}
                reportData={reportData}
                date={dateRange}
            />
        </div>
        </TooltipProvider>
    );
};
