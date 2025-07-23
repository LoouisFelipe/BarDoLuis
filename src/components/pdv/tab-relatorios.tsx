'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { analyzeData } from '@/ai/flows/business-analyst';

import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';


import { BarChart2, MessageSquare, Lightbulb } from 'lucide-react';

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
    const [ChartComponent, setChartComponent] = useState<any>(null);

    useEffect(() => {
        import('recharts').then(recharts => {
            setChartComponent(() => recharts.ResponsiveContainer);
        });
    }, []);

    if (!ChartComponent) {
        return <div className="flex justify-center items-center h-[250px]"><Spinner /></div>;
    }

    return <ChartComponent width="100%" height={250}>{children}</ChartComponent>;
};

export const TabRelatorios = ({ transactions, products, loading, showNotification, setActiveTab }) => {
    const [Recharts, setRecharts] = useState<any>(null);
    useEffect(() => {
        import('recharts').then(recharts => {
            setRecharts(recharts);
        });
    }, []);

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
        if (sales.length === 0) return { totalRevenue: 0, avgTicket: 0, salesCount: 0, topProducts: [], profitByProduct: [], salesByHour: {} };
        
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const salesCount = sales.length;
        const avgTicket = totalRevenue / salesCount;
        
        const productMetrics = sales.flatMap(sale => sale.items).reduce((acc, item) => {
            const key = item.productId || item.name;
            if (!acc[key]) acc[key] = { name: item.name, subcategoria: item.subcategoria, quantity: 0, totalRevenue: 0, profit: 0, productId: item.productId };
            acc[key].quantity += item.quantity;
            acc[key].totalRevenue += item.price * item.quantity;
            return acc;
        }, {});
        
        Object.values(productMetrics).forEach(metric => {
            const productInfo = products.find(p => p.id === metric.productId);
            if (productInfo && productInfo.costPrice > 0) {
                const profitPerUnit = (metric.totalRevenue / metric.quantity) - productInfo.costPrice;
                metric.profit = profitPerUnit * metric.quantity;
            }
        });

        const topProducts = Object.values(productMetrics).sort((a,b) => b.quantity - a.quantity).slice(0, 5);
        const profitByProduct = Object.values(productMetrics).filter(p => p.profit > 0).sort((a,b) => b.profit - a.profit).slice(0,5);

        const salesByHour = sales.reduce((acc, sale) => {
            const hour = sale.timestamp.toDate().getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        return { totalRevenue, avgTicket, salesCount, topProducts, profitByProduct, salesByHour };
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

    if (loading || !Recharts) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    const { BarChart, Bar, XAxis, YAxis, Tooltip: ChartTooltip, ResponsiveContainer } = Recharts;

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
            {transactions.length === 0 && !loading ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Sem dados para relatórios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Comece a fazer vendas para que os dados apareçam aqui e a IA possa gerar insights.</p>
                        <Button onClick={() => setActiveTab('comandas')} className="mt-4">Ir para Comandas</Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="text-center"><CardHeader><CardTitle>Faturamento</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-400">R$ {reportData.totalRevenue.toFixed(2)}</p></CardContent></Card>
                        <Card className="text-center"><CardHeader><CardTitle>Vendas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{reportData.salesCount}</p></CardContent></Card>
                        <Card className="text-center"><CardHeader><CardTitle>Ticket Médio</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-blue-400">R$ {reportData.avgTicket.toFixed(2)}</p></CardContent></Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <Card>
                          <CardHeader><CardTitle>Top 5 Produtos Mais Vendidos</CardTitle></CardHeader>
                          <CardContent>
                              <ChartContainer>
                                <BarChart data={reportData.topProducts}>
                                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                  <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                  <Bar dataKey="quantity" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Quantidade"/>
                                </BarChart>
                              </ChartContainer>
                          </CardContent>
                        </Card>
                         <Card>
                          <CardHeader><CardTitle>Top 5 Produtos Mais Lucrativos</CardTitle></CardHeader>
                          <CardContent>
                             <ChartContainer>
                                <BarChart data={reportData.profitByProduct}>
                                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/>
                                  <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value) => `R$ ${Number(value).toFixed(2)}`}/>
                                  <Bar dataKey="profit" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Lucro"/>
                                </BarChart>
                              </ChartContainer>
                          </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center"><Lightbulb className="mr-2 text-yellow-400"/> Sugestões Inteligentes</CardTitle></CardHeader>
                        <CardContent>
                             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                              {reportData.topProducts.map(item => (
                                <li key={item.name}>
                                  Considere reforçar o estoque de <strong>{item.name}</strong> — foram vendidas <strong>{item.quantity}</strong> unidades neste período.
                                </li>
                              ))}
                              {reportData.profitByProduct.map(item => (
                                <li key={item.name}>
                                  Avalie promover <strong>{item.name}</strong>, que gerou <strong>R$ {item.profit.toFixed(2)}</strong> de lucro.
                                </li>
                              ))}
                            </ul>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center"><MessageSquare className="mr-2 text-purple-400"/> Converse com seus Dados</CardTitle></CardHeader>
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
