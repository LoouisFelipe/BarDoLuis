'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { DateRange } from 'react-day-picker';
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dices, Hash, History, TrendingUp, Sparkles, Search, Info, Settings, PlusCircle, Edit, Trash2, Zap } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Transaction, Product } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { QuickGameEntryModal } from '@/components/orders/quick-game-entry-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * @fileOverview Aba de Banca de Jogos (Independente).
 * CEO: Controle separado de Jogo do Bicho, Bingo e Máquinas.
 * UI: Alinhada com a imagem de referência fornecida pelo usuário.
 */
export const GamesTab: React.FC = () => {
    const { transactions, products, loading, saveProduct, deleteProduct, finalizeOrder } = useData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('audit');
    
    // Estados para Gestão de Modalidades
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<Product | null>(null);
    const [gameToDelete, setGameToDelete] = useState<Product | null>(null);

    // 1. Filtragem de Modalidades (Produtos de tipo 'game')
    const gameModalities = useMemo(() => {
        return (products || []).filter(p => p.saleType === 'game').sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

    // 2. Auditoria: Filtragem Temporal e de Categoria
    const gameAuditData = useMemo(() => {
        if (!dateRange?.from) return { transactions: [], totalRevenue: 0, betCount: 0 };

        const interval = { 
            start: startOfDay(dateRange.from), 
            end: endOfDay(dateRange.to || dateRange.from) 
        };

        const gameSales = transactions.filter(t => {
            if (t.type !== 'sale') return false;
            const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
            const isInTime = isWithinInterval(date, interval);
            const hasGameItem = t.items?.some((item: any) => !!item.identifier || (products.find(p => p.id === item.productId)?.saleType === 'game'));
            return isInTime && hasGameItem;
        });

        let totalRevenue = 0;
        let betCount = 0;

        gameSales.forEach(t => {
            t.items?.forEach((item: any) => {
                const product = products.find(p => p.id === item.productId);
                if (item.identifier || product?.saleType === 'game') {
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
    }, [transactions, dateRange, products]);

    const filteredAudit = useMemo(() => {
        if (!searchTerm) return gameAuditData.transactions;
        return gameAuditData.transactions.filter(t => {
            const matchesTab = t.tabName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesIdentifier = t.items?.some((item: any) => 
                item.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return matchesTab || matchesIdentifier;
        });
    }, [gameAuditData.transactions, searchTerm]);

    const handleEditGame = (game: Product) => {
        setSelectedGame(game);
        setIsFormModalOpen(true);
    };

    const handleAddNewGame = () => {
        setSelectedGame(null);
        setIsFormModalOpen(true);
    };

    if (loading) return <div className="flex justify-center items-center h-[60vh]"><Spinner size="h-12 w-12" /></div>;

    return (
        <div className="p-1 md:p-4 space-y-6 pb-24">
            {/* CABEÇALHO DO DASHBOARD (Conforme imagem) */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Dices className="text-orange-500 h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground tracking-tighter">BANCA DE JOGOS</h2>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Auditagem Independente • Tavares Bastos</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="bg-background border-none shadow-none font-bold" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD RECEITA (Laranja) */}
                <Card className="border-l-4 border-l-orange-500 shadow-lg bg-card/50 overflow-hidden relative">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Receita de Banca</CardTitle>
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-4xl font-black text-orange-500">R$ {gameAuditData.totalRevenue.toFixed(2)}</div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-tighter">Total arrecadado em apostas e máquinas.</p>
                    </CardContent>
                </Card>

                {/* CARD VOLUME (Azul) */}
                <Card className="border-l-4 border-l-primary shadow-lg bg-card/50 overflow-hidden relative">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Volume de Entradas</CardTitle>
                        <Sparkles className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-4xl font-black text-primary">{gameAuditData.betCount} Registros</div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-tighter">Quantidade de apostas processadas.</p>
                    </CardContent>
                </Card>
            </div>

            {/* NOTA DO CTO (Conforme imagem) */}
            <div className="p-4 bg-muted/20 border border-dashed rounded-xl flex gap-3 items-start">
                <Info size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nota do CTO</p>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                        Estes valores são calculados com base nos itens identificados como jogos nas comandas fechadas. Este caixa deve ser conciliado separadamente do PDV de balcão.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-muted/50 p-1 h-12">
                        <TabsTrigger value="audit" className="text-xs font-black uppercase tracking-tight gap-2 px-6 h-full">
                            <History size={14} /> Log de Apostas
                        </TabsTrigger>
                        <TabsTrigger value="config" className="text-xs font-black uppercase tracking-tight gap-2 px-6 h-full">
                            <Settings size={14} /> Modalidades
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button onClick={() => setIsQuickEntryOpen(true)} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black h-12 uppercase text-xs gap-2 shadow-lg tracking-widest">
                    <Zap size={16} fill="currentColor" /> Entrada Rápida
                </Button>
            </div>

            <TabsContent value="audit" className="mt-0 space-y-6">
                <Card className="shadow-xl border-none bg-card overflow-hidden">
                    <CardHeader className="border-b pb-4 bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <History size={18} className="text-muted-foreground" />
                            <div>
                                <CardTitle className="text-lg font-black uppercase">Histórico Detalhado</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-tight">Auditagem por Milhar, Máquina e Fiel</CardDescription>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar referência..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 bg-background text-xs font-bold border-2 focus:border-orange-500"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 border-b-2">
                                    <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Hora</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Origem</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Modalidade</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase px-4 text-muted-foreground">Referência</TableHead>
                                    <TableHead className="text-right text-[9px] font-black uppercase px-4 text-muted-foreground">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAudit.length > 0 ? (
                                    filteredAudit.map((t: Transaction) => {
                                        const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                        return t.items?.filter((item: any) => {
                                            const product = products.find(p => p.id === item.productId);
                                            return !!item.identifier || product?.saleType === 'game';
                                        }).map((item: any, idx: number) => (
                                            <TableRow key={`${t.id}-${idx}`} className="hover:bg-orange-500/5 transition-colors border-b border-border/50">
                                                <TableCell className="text-[10px] font-bold px-4 whitespace-nowrap opacity-60">
                                                    {format(date, 'HH:mm')}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-black px-4 truncate max-w-[120px]">
                                                    {t.tabName || 'Venda Rápida'}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold px-4 uppercase tracking-tighter">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] font-black px-2 py-0.5">
                                                        <Hash size={8} className="mr-1" /> {item.identifier || 'Sem Ref.'}
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
                                            Nenhum registro de jogo encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="config" className="mt-0 space-y-6">
                <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-dashed">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Gerenciar Modalidades</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Cadastre os tipos de jogos disponíveis para o PDV.</p>
                    </div>
                    <Button onClick={handleAddNewGame} className="bg-primary hover:bg-primary/80 text-white font-black uppercase text-xs h-12 px-6 gap-2 shadow-lg">
                        <PlusCircle size={18} /> Nova Modalidade
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gameModalities.map(game => (
                        <Card key={game.id} className="bg-card hover:border-orange-500/50 transition-all border-2 shadow-sm">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                        <Dices size={20} />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditGame(game)}><Edit size={14} /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setGameToDelete(game)}><Trash2 size={14} /></Button>
                                    </div>
                                </div>
                                <CardTitle className="text-base mt-2 font-black uppercase">{game.name}</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{game.subcategory || 'Diversos'}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-4 mt-4 border-t border-border/50">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor Sugerido</span>
                                    <span className="text-xl font-black text-orange-500">R$ {game.unitPrice?.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {gameModalities.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/10 rounded-2xl border-2 border-dashed">
                            <p className="font-bold uppercase text-xs opacity-50 tracking-widest">Nenhuma modalidade cadastrada.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            {isFormModalOpen && (
                <ProductFormModal 
                    product={selectedGame ? { ...selectedGame, saleType: 'game' } : { saleType: 'game', category: 'Entretenimento' }}
                    allProducts={products}
                    open={isFormModalOpen}
                    onOpenChange={setIsFormModalOpen}
                    onSave={saveProduct}
                />
            )}

            {isQuickEntryOpen && (
                <QuickGameEntryModal
                    open={isQuickEntryOpen}
                    onOpenChange={setIsQuickEntryOpen}
                    gameModalities={gameModalities}
                    onSave={finalizeOrder}
                />
            )}

            {gameToDelete && (
                <AlertDialog open={!!gameToDelete} onOpenChange={(o) => !o && setGameToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-black uppercase tracking-tight">Excluir Modalidade?</AlertDialogTitle>
                            <AlertDialogDescription className="font-medium">
                                Você está prestes a excluir <strong>{gameToDelete.name}</strong>. Esta ação removerá a modalidade do PDV, mas não apagará o histórico de vendas passadas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="font-bold uppercase text-xs h-12">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90 font-black uppercase text-xs h-12 px-6" onClick={async () => {
                                if (gameToDelete.id) {
                                    await deleteProduct(gameToDelete.id);
                                    setGameToDelete(null);
                                }
                            }}>Sim, excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
};
