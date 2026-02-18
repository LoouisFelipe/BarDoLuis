'use client';

import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  History,
  Scale,
  Users,
  PlusCircle,
  ShoppingCart,
  HandCoins,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { addDoc, collection, deleteDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';

// Componentes Internos
import { db } from '@/lib/firebase';
import { useData } from '@/contexts/data-context';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner'; 
import { Combobox } from '@/components/ui/combobox';
import { TransactionDetailModal } from '@/components/financials/transaction-detail-modal'; 

/**
 * @fileOverview Aba Financeira (Redesign V5.0).
 * CTO: Implementação de KPI de 4 colunas e lista de transações em modo dark premium.
 * CEO: Visão total de "A Receber" para controle de inadimplência.
 */
export function FinancialsTab() {
    const { transactions, customers, loading, isAdmin } = useData();
    
    // --- ESTADOS ---
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const [processing, setProcessing] = useState(false);
    const [activeView, setActiveTab] = useState<'fluxo' | 'custos'>('fluxo');
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));

    // Filtros e Categorias
    const [expenseType, setExpenseType] = useState<'variable' | 'fixed'>('variable');
    const fixedCategories = {
        'aluguel': 'Aluguel', 'luz': 'Energia Elétrica', 'agua': 'Água/Esgoto', 'internet': 'Internet', 'funcionarios': 'Salários'
    };
    const variableCategories = {
        'fornecedor': 'Fornecedor Bebidas', 'manutencao': 'Manutenção', 'limpeza': 'Limpeza', 'extra': 'Extra/Outros'
    };

    // --- FORMULÁRIO ---
    const form = useForm({
        defaultValues: {
            description: '',
            amount: '',
            category: '',
            expenseDate: new Date().toISOString().split('T')[0],
            replicate: false,
            monthsToReplicate: '11'
        }
    });
    const { control, handleSubmit, setValue, watch } = form;
    const isReplicating = watch('replicate');

    // --- CÁLCULOS ---
    const filteredTransactions = useMemo(() => {
        if (!dateRange?.from || !transactions) return [];
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || dateRange.from);
        
        return transactions.filter(t => {
            const timestamp = (t.timestamp as any)?.toDate ? (t.timestamp as any).toDate() : t.timestamp;
            return timestamp && isWithinInterval(timestamp, { start, end });
        });
    }, [transactions, dateRange]);

    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        filteredTransactions.forEach(t => {
            const val = Number(t.total) || 0;
            if (t.type === 'sale' || t.type === 'payment') income += val;
            else if (t.type === 'expense') expense += val;
        });

        const accountsReceivable = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

        return {
            income,
            expense,
            balance: income - expense,
            receivable: accountsReceivable
        };
    }, [filteredTransactions, customers]);

    // --- AÇÕES ---
    const handleAddExpense = async (data: any) => {
        setProcessing(true);
        try {
            const amountVal = parseFloat(data.amount);
            const baseDoc = {
                type: 'expense',
                description: data.description,
                expenseCategory: data.category || 'Geral',
                total: amountVal,
                timestamp: Timestamp.fromDate(new Date(data.expenseDate + 'T12:00:00')),
                userId: 'system',
            };

            await addDoc(collection(db, 'transactions'), baseDoc);

            if (expenseType === 'fixed' && data.replicate) {
                const months = parseInt(data.monthsToReplicate) || 0;
                const startDate = new Date(data.expenseDate + 'T12:00:00');
                for (let i = 1; i <= months; i++) {
                    const nextDate = new Date(startDate);
                    nextDate.setMonth(startDate.getMonth() + i);
                    await addDoc(collection(db, 'transactions'), {
                        ...baseDoc,
                        timestamp: Timestamp.fromDate(nextDate),
                        description: `${data.description} (${i}/${months}) - Agendado`
                    });
                }
            }

            setIsExpenseModalOpen(false);
            form.reset();
        } catch (error) {
            console.error("Erro ao salvar despesa:", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete?.id) return;
        setProcessing(true);
        try {
            await deleteDoc(doc(db, 'transactions', transactionToDelete.id));
            setTransactionToDelete(null);
        } catch (error) {
            console.error("Erro ao deletar:", error);
        } finally {
            setProcessing(false);
        }
    };

    const formattedPeriodHeader = useMemo(() => {
        if (!dateRange?.from) return "";
        const fromStr = format(dateRange.from, "dd/MM/yy");
        const toStr = format(dateRange.to || dateRange.from, "dd/MM/yy");
        return `${fromStr} A ${toStr}`;
    }, [dateRange]);

    return (
        <div className="p-1 md:p-4 space-y-8 animate-in fade-in duration-500">
            
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <History className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none">Financeiro</h2>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.25em] mt-1">Gestão de Fluxo de Caixa • Tavares Bastos</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="bg-card/50 border-none shadow-none font-bold h-12" />
                    <Button 
                        onClick={() => setIsExpenseModalOpen(true)} 
                        className="bg-red-600 hover:bg-red-700 text-white font-black h-12 uppercase text-xs gap-2 px-6 shadow-lg shadow-red-900/20"
                    >
                        <PlusCircle size={18} /> Nova Despesa
                    </Button>
                </div>
            </div>

            {/* Matrix de KPIs (4 Colunas - Estilo Blueprint) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Entradas</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">R$ {stats.income.toFixed(2)}</div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={18} className="text-red-500" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saídas</span>
                    </div>
                    <div className="text-3xl font-black text-red-500">R$ {stats.expense.toFixed(2)}</div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Scale size={18} className="text-primary" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo</span>
                    </div>
                    <div className="text-3xl font-black text-primary">R$ {stats.balance.toFixed(2)}</div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-yellow-500" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">A Receber</span>
                    </div>
                    <div className="text-3xl font-black text-yellow-400">R$ {stats.receivable.toFixed(2)}</div>
                </div>
            </div>

            {/* Sub-Tabs Navegação */}
            <div className="flex bg-card/30 p-1 rounded-xl border border-border/40 w-fit">
                <Button 
                    variant="ghost" 
                    onClick={() => setActiveTab('fluxo')}
                    className={cn(
                        "text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-lg transition-all",
                        activeView === 'fluxo' ? "bg-primary/20 text-primary border border-primary/50" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <History size={14} /> Fluxo de Caixa
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={() => setActiveTab('custos')}
                    className={cn(
                        "text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-lg transition-all",
                        activeView === 'custos' ? "bg-primary/20 text-primary border border-primary/50" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <ArrowRightLeft size={14} /> Custos Fixos (Planos)
                </Button>
            </div>

            {/* Título da Listagem */}
            <div className="pt-4">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    Transações de {formattedPeriodHeader}
                </h3>
            </div>

            {/* Lista de Transações (Modo Dark Premium) */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center p-20"><Spinner size="h-12 w-12" /></div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground font-black uppercase text-xs opacity-40 italic border-2 border-dashed rounded-3xl">
                        Nenhuma transação capturada no período.
                    </div>
                ) : (
                    filteredTransactions.map((t: any) => {
                        const dateVal = t.timestamp instanceof Date ? t.timestamp : t.timestamp?.toDate?.() || new Date();
                        const isExpense = t.type === 'expense';
                        const isSale = t.type === 'sale';
                        const isPayment = t.type === 'payment';
                        
                        return (
                            <div 
                                key={t.id}
                                className="group flex items-center p-5 rounded-2xl bg-card/40 border-2 border-transparent hover:border-primary/30 transition-all shadow-sm cursor-pointer"
                                onClick={() => setSelectedTransaction(t)}
                            >
                                <div className={cn(
                                    "mr-5 p-3 rounded-xl", 
                                    isExpense ? 'bg-red-500/10 text-red-500' : 
                                    isSale ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                                )}>
                                    {isSale ? <ShoppingCart size={20} /> : isPayment ? <HandCoins size={20} /> : <TrendingDown size={20} />}
                                </div>
                                
                                <div className="flex-grow min-w-0 pr-4">
                                    <p className="font-black text-base truncate uppercase tracking-tight text-slate-100">
                                        {t.description || (isSale ? `VENDA: ${t.tabName || 'BALCÃO'}` : t.type)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                        {format(dateVal, 'HH:mm')} • {t.paymentMethod || t.expenseCategory || 'Geral'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className={cn(
                                            "font-black text-xl whitespace-nowrap", 
                                            isExpense ? 'text-red-500' : 'text-emerald-400'
                                        )}>
                                            {isExpense ? '-' : '+'} R$ {Number(t.total || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {isAdmin && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-10 w-10 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" 
                                            onClick={(e) => {e.stopPropagation(); setTransactionToDelete(t)}}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- MODAIS --- */}

            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent className="sm:max-w-md bg-card border-border/40">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                            <TrendingDown className="text-red-500" /> Registrar Saída
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground">
                            Controle de custos e gastos operacionais da Tavares Bastos.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4 py-4">
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tipo de Saída</FormLabel>
                                <Select onValueChange={(value: 'variable' | 'fixed') => { setExpenseType(value); setValue('category', ''); }} value={expenseType}>
                                    <FormControl><SelectTrigger className="h-12 bg-background border-2 font-bold"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="variable" className="font-bold uppercase text-xs">Despesa Variável (Avulsa)</SelectItem>
                                        <SelectItem value="fixed" className="font-bold uppercase text-xs">Custo Fixo (Recorrente)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                            
                            <FormField control={control} name="description" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descrição</FormLabel><FormControl><Input placeholder="Ex: Gelo, Limpeza..." required {...field} className="h-12 bg-background border-2 font-bold" /></FormControl></FormItem>
                            )}/>
                            
                            <FormField control={control} name="category" render={({ field }) => {
                                const cats = expenseType === 'fixed' ? fixedCategories : variableCategories;
                                return (
                                    <FormItem className="flex flex-col"><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Categoria</FormLabel><FormControl>
                                        <Combobox 
                                            options={Object.entries(cats).map(([v, l]) => ({ value: v, label: l }))} 
                                            value={field.value} 
                                            onChange={(val) => field.onChange(val)} 
                                            placeholder="Selecione..." 
                                            createLabel="Criar:" 
                                        />
                                    </FormControl></FormItem>
                                )
                            }}/>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" required {...field} className="h-12 bg-background border-2 font-black text-red-500 text-lg" /></FormControl></FormItem>
                                )}/>
                                <FormField control={control} name="expenseDate" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data</FormLabel><FormControl><Input type="date" required {...field} className="h-12 bg-background border-2 font-bold" /></FormControl></FormItem>
                                )}/>
                            </div>

                            {expenseType === 'fixed' && (
                                <div className="p-4 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 space-y-4">
                                    <FormField control={control} name="replicate" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between space-y-0">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Recorrência</FormLabel>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase leading-none">Repetir mensalmente</p>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={(val) => { field.onChange(val); if(val) setValue('monthsToReplicate', '11'); }} className="data-[state=checked]:bg-primary"/>
                                            </FormControl>
                                        </FormItem>
                                    )}/>
                                    {isReplicating && (
                                        <FormField control={control} name="monthsToReplicate" render={({ field }) => (
                                            <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Meses</FormLabel><FormControl><Input type="number" {...field} className="h-10 bg-background border-2 font-bold" /></FormControl></FormItem>
                                        )}/>
                                    )}
                                </div>
                            )}

                            <DialogFooter className="pt-4 gap-2 flex-col sm:flex-row">
                                <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} className="h-12 font-black uppercase text-xs">Cancelar</Button>
                                <Button type="submit" disabled={processing} className="h-12 font-black uppercase text-sm shadow-lg bg-red-600 hover:bg-red-700 text-white flex-1">
                                    {processing ? <Spinner /> : "Gravar Despesa"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
             
            {transactionToDelete && (
                <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                    <AlertDialogContent className="bg-card border-2 border-border/40">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-black uppercase text-red-500 tracking-tight">Excluir Transação?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed">
                                Esta ação anulará o registro de &quot;{transactionToDelete.description || 'Venda/Despesa'}&quot;. O saldo será recalculado instantaneamente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="h-12 font-black uppercase text-[10px]">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTransaction} className="h-12 font-black uppercase text-[10px] bg-red-600 text-white hover:bg-red-700 shadow-lg">
                                {processing ? <Spinner /> : 'Confirmar Anulação'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {selectedTransaction && (
                <TransactionDetailModal 
                    transaction={selectedTransaction} 
                    open={!!selectedTransaction} 
                    onOpenChange={() => setSelectedTransaction(null)} 
                />
            )}
        </div>
    );
}