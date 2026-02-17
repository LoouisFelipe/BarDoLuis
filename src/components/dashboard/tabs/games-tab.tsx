
'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { DateRange } from 'react-day-picker';
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dices, Hash, History, TrendingUp, Sparkles, Search, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Transaction, OrderItem } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

/**
 * @fileOverview Aba de Auditoria Independente de Jogos.
 * CEO: Controle separado de Jogo do Bicho, Bingo e Máquinas.
 */
export const GamesTab: React.FC = () => {
    const { transactions, loading } = useData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Filtragem Temporal e de Categoria
    const gameData = useMemo(() => {
        if (!dateRange?.from) return { transactions: [], totalRevenue: 0, betCount: 0 };

        const interval = { 
            start: startOfDay(dateRange.from), 
            end: endOfDay(dateRange.to || dateRange.from) 
        };

        const gameSales = transactions.filter(t => {
            if (t.type !== 'sale') return false;
            const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
            const isInTime = isWithinInterval(date, interval);
            const hasGameItem = t.items?.some((item: any) => {
                // Procuramos por itens que tenham 'identifier' ou cujo produto seja categorizado como game
                // Nota: O identifier é o sinal mais forte de um registro de jogo ativo
                return !!item.identifier;
            });
            return isInTime && hasGameItem;
        });

        // Calculamos apenas o valor dos ITENS de jogo dentro dessas vendas
        let totalRevenue = 0;
        let betCount = 0;

        gameSales.forEach(t => {
            t.items?.forEach((item: any) => {
                if (item.identifier) {
                    totalRevenue += (item.unitPrice * item.quantity);
                    betCount += item.quantity;
                }
            });
        });

        return {
            transactions: gameSales.sort((a, b) => {
                const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
                const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
                return dateB.getTime() - dateA.getTime();
            }),
            totalRevenue,
            betCount
        };
    }, [transactions, dateRange]);

    // 2. Filtro de busca (por identificador ou nome do jogo)
    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return gameData.transactions;
        return gameData.transactions.filter(t => {
            const matchesTab = t.tabName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesIdentifier = t.items?.some((item: any) => 
                item.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return matchesTab || matchesIdentifier;
        });
    }, [gameData.transactions, searchTerm]);

    if (loading) return <div className="flex justify-center items-center h-[60vh]"><Spinner size="h-12 w-12" /></div>;

    return (
        <div className="p-1 md:p-4 space-y-6 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-foreground flex items-center tracking-tight">
                        <Dices className="mr-3 text-orange-500" /> BANCA DE JOGOS
                    </h2>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mt-1">Auditagem Independente • Tavares Bastos</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
            </div>

            {/* Dash de Indicadores de Banca */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-orange-500 shadow-sm bg-gradient-to-br from-card to-orange-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Receita de Banca</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-orange-500">R$ {gameData.totalRevenue.toFixed(2)}</div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total arrecadado em apostas e máquinas.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Volume de Entradas</CardTitle>
                        <Sparkles className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-primary">{gameData.betCount} Registros</div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Quantidade de apostas processadas.</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1 bg-muted/20 border-dashed border-2 flex items-center p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-background rounded-full text-muted-foreground">
                            <Info size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Nota do CTO</p>
                            <p className="text-[11px] leading-tight text-muted-foreground/80 font-medium">
                                Estes valores são calculados com base nos itens identificados como jogos nas comandas fechadas. Este caixa deve ser conciliado separadamente do PDV de balcão.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Listagem Analítica */}
            <Card className="shadow-lg border-none bg-card">
                <CardHeader className="border-b pb-4 bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-muted-foreground" />
                        <div>
                            <CardTitle className="text-lg">Log de Apostas</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-tight">Detalhamento por Milhar e Máquina</CardDescription>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar milhar ou jogo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 bg-background text-xs font-bold"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b-2">
                                <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Hora</TableHead>
                                <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Comanda</TableHead>
                                <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Jogo / Item</TableHead>
                                <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Referência</TableHead>
                                <TableHead className="text-right text-[9px] font-black uppercase px-4 text-muted-foreground">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t: Transaction) => {
                                    const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                    return t.items?.filter((item: any) => !!item.identifier).map((item: any, idx: number) => (
                                        <TableRow key={`${t.id}-${idx}`} className="hover:bg-orange-500/5 transition-colors border-b border-border/50">
                                            <TableCell className="text-[10px] font-bold px-4 whitespace-nowrap opacity-60">
                                                {format(date, 'HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-[10px] font-black px-4 truncate max-w-[120px]">
                                                {t.tabName || 'Balcão'}
                                            </TableCell>
                                            <TableCell className="text-[10px] font-bold px-4 uppercase tracking-tighter">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] font-black px-2 py-0.5">
                                                    <Hash size={8} className="mr-1" /> {item.identifier}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-black text-orange-500 px-4 whitespace-nowrap">
                                                R$ {(item.unitPrice * item.quantity).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ));
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-bold text-xs uppercase opacity-50">
                                        Nenhum registro de jogo no período selecionado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
