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
 * UI: Alinhada com a imagem de referência oficial.
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
            const hasGameItem = t.items?.some((item: any) => {
                const product = products.find(p => p.id === item.productId);
                return !!item.identifier || product?.saleType === 'game';
            });
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
            {/* CABEÇALHO DO DASHBOARD (Ref: Imagem) */}
            <div className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <Dices className="text-orange-500 h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">BANCA DE JOGOS</h2>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.25em] mt-1">Auditagem Independente • Tavares Bastos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="bg-background/50 border-none shadow-none font-bold" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD RECEITA (Laranja - Ref: Imagem) */}
                <Card className="border-l-4 border-l-orange-500 shadow-xl bg-card/40 overflow-hidden relative group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Receita de Banca</CardTitle>
                        <TrendingUp className="h-5 w-5 text-orange-500 transition-transform group-hover:scale-110" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-4xl font-black text-orange-500">R$ {gameAuditData.totalRevenue.toFixed(2)}</div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2 tracking-tight opacity-70">Total arrecadado em apostas e máquinas.</p>
                    </CardContent>
                </Card>

                {/* CARD VOLUME (Azul - Ref: Imagem) */}
                <Card className="border-l-4 border-l-primary shadow-xl bg-card/40 overflow-hidden relative group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Volume de Entradas</CardTitle>
                        <Sparkles className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-4xl font-black text-primary">{gameAuditData.betCount} Registros</div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2 tracking-tight opacity-70">Quantidade de apostas processadas no período.</p>
                    </CardContent>
                </Card>
            </div>

            {/* NOTA DO CTO (Ref: Imagem) */}
            <div className="p-5 bg-muted/10 border border-dashed border-border/60 rounded-2xl flex gap-4 items-start">
                <div className="p-2 bg-muted/20 rounded-full shrink-0">
                    <Info size={18} className="text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nota do CTO</p>
                    <p className="text-[11px] text-muted-foreground/80 font-medium leading-relaxed max-w-3xl">
                        Estes valores são calculados com base nos itens identificados como jogos nas comandas fechadas. Este caixa deve ser conciliado separadamente do PDV de balcão para garantir a integridade da banca independente.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex bg-card/50 p-1.5 rounded-xl border border-border/40 w-full sm:w-auto">
                    <Button 
                        variant={activeTab === 'audit' ? 'secondary' : 'ghost'} 
                        onClick={() => setActiveTab('audit')}
                        className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-lg"
                    >
                        <History size={14} /> Log de Apostas
                    </Button>
                    <Button 
                        variant={activeTab === 'config' ? 'secondary' : 'ghost'} 
                        onClick={() => setActiveTab('config')}
                        className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-lg"
                    >
                        <Settings size={14} /> Modalidades
                    </Button>
                </div>
                <Button onClick={() => setIsQuickEntryOpen(true)} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black h-12 uppercase text-xs gap-3 shadow-lg tracking-widest transition-all hover:-translate-y-0.5">
                    <Zap size={16} fill="currentColor" /> Entrada Rápida
                </Button>
            </div>

            <TabsContent value="audit" className={cn("mt-0 space-y-6", activeTab !== 'audit' && "hidden")}>
                <Card className="shadow-2xl border-none bg-card overflow-hidden">
                    <CardHeader className="border-b pb-4 bg-muted/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <History size={18} className="text-primary" />
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">Auditagem Detalhada</CardTitle>
                                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Monitoramento de Milhar, Máquina e Fiel</CardDescription>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar milhar ou modalidade..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 bg-background/50 text-xs font-bold border-2 focus:border-orange-500 transition-all"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 border-b-2">
                                    <TableHead className="text-[9px] font-black uppercase px-6 text-muted-foreground">Hora</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase px-6 text-muted-foreground">Origem</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase px-6 text-muted-foreground">Modalidade</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase px-6 text-muted-foreground">Referência</TableHead>
                                    <TableHead className="text-right text-[9px] font-black uppercase px-6 text-muted-foreground">Valor</TableHead>
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
                                            <TableRow key={`${t.id}-${idx}`} className="hover:bg-orange-500/[0.03] transition-colors border-b border-border/30">
                                                <TableCell className="text-[10px] font-bold px-6 whitespace-nowrap opacity-60">
                                                    {format(date, 'HH:mm')}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-black px-6 truncate max-w-[140px]">
                                                    {t.tabName || 'Venda Rápida'}
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold px-6 uppercase tracking-tight">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] font-black px-2 py-0.5 rounded-md">
                                                        <Hash size={8} className="mr-1" /> {item.identifier || 'Sem Ref.'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-black text-orange-500 px-6 whitespace-nowrap">
                                                    R$ {(item.unitPrice * item.quantity).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-24 text-muted-foreground font-bold text-xs uppercase opacity-40 italic tracking-widest">
                                            Nenhum registro de jogo capturado no período.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="config" className={cn("mt-0 space-y-6", activeTab !== 'config' && "hidden")}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl border border-dashed border-border/60 gap-4">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Gerenciar Modalidades</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Configure os tipos de jogos disponíveis para o PDV.</p>
                    </div>
                    <Button onClick={handleAddNewGame} className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-white font-black uppercase text-[10px] h-11 px-6 gap-2 shadow-lg">
                        <PlusCircle size={16} /> Nova Modalidade
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gameModalities.map(game => (
                        <Card key={game.id} className="bg-card hover:border-orange-500/40 transition-all border-2 shadow-sm relative overflow-hidden group">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                                        <Dices size={24} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditGame(game)}><Edit size={14} /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setGameToDelete(game)}><Trash2 size={14} /></Button>
                                    </div>
                                </div>
                                <CardTitle className="text-base mt-3 font-black uppercase tracking-tight">{game.name}</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{game.subcategory || 'Modalidade Geral'}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-4 mt-4 border-t border-border/30 bg-muted/5">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Preço Sugerido</span>
                                    <span className="text-xl font-black text-orange-500">R$ {game.unitPrice?.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {gameModalities.length === 0 && (
                        <div className="col-span-full py-24 text-center text-muted-foreground bg-muted/5 rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
                            <Dices size={48} className="opacity-20" />
                            <p className="font-bold uppercase text-[10px] opacity-50 tracking-[0.2em]">Nenhuma modalidade cadastrada na banca.</p>
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
                    allProducts={products}
                    onSave={finalizeOrder}
                    onSaveProduct={saveProduct}
                />
            )}

            {gameToDelete && (
                <AlertDialog open={!!gameToDelete} onOpenChange={(o) => !o && setGameToDelete(null)}>
                    <AlertDialogContent className="bg-card border-2">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-black uppercase tracking-tight text-destructive">Excluir Modalidade?</AlertDialogTitle>
                            <AlertDialogDescription className="font-bold text-xs uppercase tracking-tight text-muted-foreground leading-relaxed">
                                Você está prestes a excluir <strong>{gameToDelete.name}</strong>. Esta ação removerá a modalidade do PDV imediato, mas não afetará os registros históricos de vendas passadas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="font-black uppercase text-[10px] h-12 border-2">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90 font-black uppercase text-[10px] h-12 px-8 shadow-lg" onClick={async () => {
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
