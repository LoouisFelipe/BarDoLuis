'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns'; 
import { BarChart2, TrendingDown, TrendingUp, ReceiptText, Target, HandCoins, Edit, ArrowUpRight, ArrowDownRight, Minus, Scale, ShoppingCart } from 'lucide-react'; 
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SalesRevenueReportModal } from '@/components/financials/sales-revenue-report-modal';
import { CashInflowReportModal } from '@/components/financials/cash-inflow-report-modal';
import { ExpensesReportModal } from '@/components/financials/expenses-report-modal';
import { ProfitReportModal } from '@/components/financials/profit-report-modal';
import { SalesVolumeReportModal } from '@/components/financials/sales-volume-report-modal';
import { PurchasesReportModal } from '@/components/financials/purchases-report-modal';
import { useReportData } from '@/hooks/use-report-data';
import { CockpitSkeleton } from '../CockpitSkeleton';
import { Spinner } from '@/components/ui/spinner';
import { AIBusinessAnalyst } from '../ai-business-analyst';

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

export const CockpitTab: React.FC = () => {
    const { transactions, products, customers, loading } = useData();
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));
    
    const [manualGoal, setManualGoal] = useState(0);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    
    // Estados dos Modais
    const [isSalesRevenueModalOpen, setIsSalesRevenueModalOpen] = useState(false);
    const [isCashInflowModalOpen, setIsCashInflowModalOpen] = useState(false);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
    const [isSalesVolumeModalOpen, setIsSalesVolumeModalOpen] = useState(false);
    const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);

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
                    <div>
                        <h2 className="text-3xl font-black text-foreground flex items-center tracking-tight">
                            <BarChart2 className="mr-3 text-primary" /> B.I. COCKPIT
                        </h2>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mt-1">Fortaleza Privada • Unidade Tavares Bastos</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all border-l-4 border-l-accent shadow-sm group" onClick={() => setIsSalesRevenueModalOpen(true)}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Receita Bruta</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors"/>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline"><div className="text-2xl font-black text-accent">R$ {(reportData.totalSalesRevenue || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.revenue} /></div>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all border-l-4 border-l-sky-400 shadow-sm group" onClick={() => setIsCashInflowModalOpen(true)}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Caixa Real</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground group-hover:text-sky-400 transition-colors"/></CardHeader>
                            <CardContent><div className="flex items-baseline"><div className="text-2xl font-black text-sky-400">R$ {(reportData.totalCashInflow || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.cashInflow} /></div></CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all border-l-4 border-l-primary shadow-sm group" onClick={() => setIsProfitModalOpen(true)}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lucro Líquido</CardTitle><Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-black text-primary">R$ {(reportData.netProfit || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.netProfit} /></div></CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all border-l-4 border-l-destructive shadow-sm group" onClick={() => setIsExpensesModalOpen(true)}> 
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Despesas</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-black text-destructive">R$ {(reportData.totalExpenses || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.expenses} inverse /></div></CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all border-l-4 border-l-orange-500 shadow-sm group" onClick={() => setIsPurchasesModalOpen(true)}> 
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Compras (Insumos)</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors"/>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline">
                                    <div className="text-2xl font-black text-orange-500">R$ {(reportData.totalInsumos || 0).toFixed(2)}</div>
                                    <TrendIndicator value={reportData.deltas?.insumos} inverse />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all shadow-sm" onClick={() => setIsProfitModalOpen(true)}> 
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lucro Bruto</CardTitle><Scale className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-black">R$ {(reportData.grossProfit || 0).toFixed(2)}</div><TrendIndicator value={reportData.deltas?.grossProfit} /></div></CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:bg-secondary/50 transition-all shadow-sm group" onClick={() => setIsSalesVolumeModalOpen(true)}> 
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Atendimentos</CardTitle><ReceiptText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"/></CardHeader><CardContent><div className="flex items-baseline"><div className="text-2xl font-black">+{reportData.salesCount || 0}</div><TrendIndicator value={reportData.deltas?.salesCount} /></div></CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-yellow-400 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Progresso da Meta</CardTitle>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingGoal(true)}>
                                    <Edit className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isEditingGoal ? (
                                    <Input
                                        type="number"
                                        value={manualGoal}
                                        onChange={(e) => setManualGoal(Number(e.target.value))}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditingGoal(false); }}
                                        className="h-8 text-2xl font-black text-yellow-400 p-1 bg-transparent border-none"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="text-2xl font-black text-yellow-400">{(reportData.goalProgress || 0).toFixed(0)}%</div>
                                )}
                                <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-2">
                                    <div className="bg-yellow-400 h-full transition-all duration-1000" style={{ width: `${Math.min(reportData.goalProgress || 0, 100)}%` }} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-4">
                        <AIBusinessAnalyst reportData={reportData} />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-lg border-none bg-card/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-black uppercase tracking-widest">Top 10 Mix de Vendas</CardTitle><CardDescription className="text-[10px]">por quantidade vendida no período.</CardDescription></CardHeader>
                        <CardContent><div className="h-[350px] w-full"><TopProductsChart data={reportData.topProducts || []} /></div></CardContent>
                    </Card>
                    <Card className="shadow-lg border-none bg-card/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-black uppercase tracking-widest">Top 10 Produtos (Lucratividade)</CardTitle><CardDescription className="text-[10px]">por lucro bruto gerado no período.</CardDescription></CardHeader>
                      <CardContent><div className="h-[350px] w-full"><ProfitByProductChart data={reportData.profitByProduct || []} /></div></CardContent>
                    </Card>
                    <Card className="shadow-lg border-none bg-card/50">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-black uppercase tracking-widest">Mapa de Calor Operacional</CardTitle><CardDescription className="text-[10px]">densidade de vendas por dia e hora.</CardDescription></CardHeader>
                        <CardContent><div className="h-[350px] w-full"><SalesHeatmapChart data={reportData.salesHeatmapData || []} /></div></CardContent>
                    </Card>
                     <Card className="shadow-lg border-none bg-card/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Investimento por Parceiro</CardTitle>
                            <CardDescription className="text-[10px]">distribuição do orçamento de compras.</CardDescription>
                        </CardHeader>
                        <CardContent><div className="h-[350px] w-full"><SalesByPaymentMethodChart data={reportData.purchasesBySupplierForChart || []} /></div></CardContent>
                    </Card>
                </div>

                <SalesRevenueReportModal open={isSalesRevenueModalOpen} onOpenChange={setIsSalesRevenueModalOpen} reportData={reportData} periodGoal={reportData.finalGoal} date={dateRange} />
                <CashInflowReportModal open={isCashInflowModalOpen} onOpenChange={setIsCashInflowModalOpen} reportData={reportData} date={dateRange} />
                <ExpensesReportModal open={isExpensesModalOpen} onOpenChange={setIsExpensesModalOpen} reportData={reportData} date={dateRange} />
                <ProfitReportModal open={isProfitModalOpen} onOpenChange={setIsProfitModalOpen} reportData={reportData} date={dateRange} />
                <SalesVolumeReportModal open={isSalesVolumeModalOpen} onOpenChange={setIsSalesVolumeModalOpen} reportData={reportData} date={dateRange} />
                <PurchasesReportModal open={isPurchasesModalOpen} onOpenChange={setIsPurchasesModalOpen} reportData={reportData} date={dateRange} />
            </div>
        </TooltipProvider>
    );
};
