'use client';
import React, { useState, useMemo } from 'react';
import { analyzeData } from '@/ai/flows/business-analyst';

import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { BarChart2, MessageSquare } from 'lucide-react';

export const TabRelatorios = ({ transactions, products, loading }) => {
    const [period, setPeriod] = useState('today');
    const [iaResult, setIaResult] = useState('');
    const [iaLoading, setIaLoading] = useState(false);
    const [iaQuestion, setIaQuestion] = useState('');

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        return transactions.filter(t => {
            if (!t.timestamp) return false;
            const tDate = t.timestamp.toDate();
            switch (period) {
                case 'week': return tDate >= weekStart;
                case 'month': return tDate >= monthStart;
                case 'today': default: return tDate >= today;
            }
        });
    }, [transactions, period]);

    const reportData = useMemo(() => {
        const sales = filteredTransactions.filter(t => t.type === 'sale');
        if (sales.length === 0) return { totalRevenue: 0, avgTicket: 0, salesCount: 0, byPayment: {}, topProducts: [], profitByProduct: [], salesByHour: {} };
        
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const salesCount = sales.length;
        const avgTicket = totalRevenue / salesCount;
        const byPayment = sales.reduce((acc, sale) => { acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total; return acc; }, {});
        
        const productMetrics = sales.flatMap(sale => sale.items).reduce((acc, item) => {
            if (!acc[item.productId]) acc[item.productId] = { name: item.name, subcategoria: item.subcategoria, quantity: 0, totalRevenue: 0 };
            acc[item.productId].quantity += item.quantity;
            acc[item.productId].totalRevenue += item.price * item.quantity;
            return acc;
        }, {});

        const topProducts = Object.values(productMetrics).sort((a,b) => b.quantity - a.quantity).slice(0,5);

        const profitByProduct = Object.keys(productMetrics).map(productId => {
            const product = products.find(p => p.id === productId);
            const cost = product?.costPrice || 0;
            const revenue = productMetrics[productId].totalRevenue;
            const quantity = productMetrics[productId].quantity;
            const totalCost = cost * quantity;
            const profit = revenue - totalCost;
            return { name: `${productMetrics[productId].name} ${productMetrics[productId].subcategoria || ''}`, profit };
        }).sort((a,b) => b.profit - a.profit).slice(0,5);

        const salesByHour = sales.reduce((acc, sale) => {
            const hour = sale.timestamp.toDate().getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        return { totalRevenue, avgTicket, salesCount, byPayment, topProducts, profitByProduct, salesByHour };
    }, [filteredTransactions, products]);

    const handleAskAI = async (e) => {
        e.preventDefault();
        if (!iaQuestion.trim()) return;
        setIaLoading(true);
        setIaResult('');
        
        const salesSummary = filteredTransactions.filter(t => t.type === 'sale').map(s => ({
            total: s.total,
            items: s.items.length,
            hour: s.timestamp.toDate().getHours(),
            day: s.timestamp.toDate().getDay()
        }));

        try {
            const result = await analyzeData({
                salesSummary,
                question: iaQuestion
            });
            setIaResult(result.answer);
        } catch(error) {
            console.error("Error asking AI:", error);
            setIaResult("Ocorreu um erro ao processar a pergunta.");
        } finally {
            setIaLoading(false);
        }
    };

    return (
        <TooltipProvider>
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-foreground flex items-center"><BarChart2 className="mr-3" /> Relatórios & IA</h2>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px] bg-secondary">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Esta Semana</SelectItem>
                        <SelectItem value="month">Este Mês</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="text-center"><CardHeader><CardTitle>Faturamento</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-400">R$ {reportData.totalRevenue.toFixed(2)}</p></CardContent></Card>
                        <Card className="text-center"><CardHeader><CardTitle>Vendas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{reportData.salesCount}</p></CardContent></Card>
                        <Card className="text-center"><CardHeader><CardTitle>Ticket Médio</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-blue-400">R$ {reportData.avgTicket.toFixed(2)}</p></CardContent></Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Vendas por Pagamento</CardTitle></CardHeader><CardContent><ul className="space-y-2">{Object.entries(reportData.byPayment).map(([method, total]) => <li key={method} className="flex justify-between text-muted-foreground"><span>{method}</span><span className="font-semibold">R$ {total.toFixed(2)}</span></li>)}</ul></CardContent></Card>
                        <Card><CardHeader><CardTitle>Produtos Mais Vendidos</CardTitle></CardHeader><CardContent><ul className="space-y-2">{reportData.topProducts.map(p => <li key={p.name} className="flex justify-between text-muted-foreground"><span>{p.name}</span><span className="font-semibold">{p.quantity} un.</span></li>)}</ul></CardContent></Card>
                        <Card><CardHeader><CardTitle>Produtos Mais Lucrativos</CardTitle></CardHeader><CardContent><ul className="space-y-2">{reportData.profitByProduct.map(p => <li key={p.name} className="flex justify-between text-muted-foreground"><span>{p.name}</span><span className="font-semibold text-green-400">R$ {p.profit.toFixed(2)}</span></li>)}</ul></CardContent></Card>
                        <Card>
                            <CardHeader><CardTitle>Vendas por Hora</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-end h-32 gap-1">{Array.from({length: 24}, (_, i) => i).map(hour => 
                                    <Tooltip key={hour}>
                                        <TooltipTrigger asChild>
                                            <div className="flex-1 bg-primary rounded-t-sm hover:bg-primary/80" style={{height: `${(reportData.salesByHour[hour] || 0) * 15}%`}}>
                                                <div className="h-full w-full"></div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{`${hour}h: ${reportData.salesByHour[hour] || 0} vendas`}</p></TooltipContent>
                                    </Tooltip>
                                )}</div>
                            </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center"><MessageSquare className="mr-2 text-yellow-400"/> Converse com seus Dados</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleAskAI} className="flex gap-2">
                                <Input type="text" value={iaQuestion} onChange={e => setIaQuestion(e.target.value)} placeholder="Qual foi o dia mais movimentado da semana?" />
                                <Button type="submit" disabled={iaLoading} className="bg-purple-600 text-white font-semibold hover:bg-purple-500 disabled:opacity-50">Perguntar</Button>
                            </form>
                            {iaLoading && <div className="mt-4 flex justify-center"><Spinner /></div>}
                            {iaResult && <div className="mt-4 p-4 bg-secondary rounded-lg whitespace-pre-wrap text-foreground animate-fade-in">{iaResult}</div>}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
        </TooltipProvider>
    );
};
