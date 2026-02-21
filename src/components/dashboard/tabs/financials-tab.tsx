
'use client';

import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  History,
  Scale,
  Users,
  PlusCircle,
  ArrowRightLeft,
  Trash2,
  CalendarDays,
  Repeat,
  Info,
  ShoppingCart,
  HandCoins
} from 'lucide-react';
import { useForm } from 'react-hook-form';

// Componentes Internos
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner'; 
import { Combobox } from '@/components/ui/combobox';
import { TransactionDetailModal } from '@/components/financials/transaction-detail-modal'; 
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';

/**
 * @fileOverview Aba Financeira Mobile-Optimized.
 * CTO: Saneamento de build (isAdmin via useAuth) e sintaxe JSX blindada.
 */
export function FinancialsTab() {
    const { transactions, customers, recurringExpenses, loading, addExpense, deleteTransaction } = useData();
    const { isAdmin } = useAuth(); 
    
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const [processing, setProcessing] = useState(false);
    const [activeView, setActiveTab] = useState<'fluxo' | 'custos'>('fluxo');
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));

    const fixedCategories = {
        'aluguel': 'Aluguel', 'luz': 'Energia Elétrica', 'agua': 'Água/Esgoto', 'internet': 'Internet', 'funcionarios': 'Salários'
    };
    const variableCategories = {
        'fornecedor': 'Fornecedor Bebidas', 'manutencao': 'Manutenção', 'limpeza': 'Limpeza', 'extra': 'Extra/Outros'
    };

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
    const [expenseType, setExpenseType] = useState<'variable' | 'fixed'>('variable');

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

        const accountsReceivable = (customers || []).reduce((acc, c) => acc + (c.balance || 0), 0);

        return {
            income,
            expense,
            balance: income - expense,
            receivable: accountsReceivable
        };
    }, [filteredTransactions, customers]);

    const handleAddExpense = async (data: any) => {
        setProcessing(true);
        try {
            const amountVal = parseFloat(data.amount);
            const replicateCount = (expenseType === 'fixed' && data.replicate) ? parseInt(data.monthsToReplicate) : 0;
            
            await addExpense(
                data.description,
                amountVal,
                data.category || 'Geral',
                data.expenseDate,
                replicateCount
            );

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
            await deleteTransaction(transactionToDelete.id);
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
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6 animate-in fade-in duration-500 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-5 rounded-2xl shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight leading-none uppercase">Financeiro</h2>
                            <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mt-1">Gestão de Fluxo & Custos • Tavares Bastos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} className="flex-grow h-12 rounded-xl" />
                        <Button 
                            onClick={() => setIsExpenseModalOpen(true)} 
                            className="bg-red-600 hover:bg-red-700 text-white font-black h-12 uppercase text-[10px] gap-2 px-4 shadow-lg shadow-red-900/20 shrink-0 rounded-xl"
                        >
                            <PlusCircle size={16} /> Nova Saída
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-emerald-500/5 border-emerald-500/20 p-4 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Entradas</span>
                        </div>
                        <div className="text-xl font-black text-emerald-400">R$ {stats.income.toFixed(2)}</div>
                    </Card>

                    <Card className="bg-red-500/5 border-red-500/20 p-4 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown size={14} className="text-red-500" />
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Saídas</span>
                        </div>
                        <div className="text-xl font-black text-red-500">R$ {stats.expense.toFixed(2)}</div>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <Scale size={14} className="text-primary" />
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Saldo Líquido</span>
                        </div>
                        <div className="text-xl font-black text-primary">R$ {stats.balance.toFixed(2)}</div>
                    </Card>

                    <Card className="bg-yellow-500/5 border-yellow-500/20 p-4 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={14} className="text-yellow-500" />
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">A Receber</span>
                        </div>
                        <div className="text-xl font-black text-yellow-400">R$ {stats.receivable.toFixed(2)}</div>
                    </Card>
                </div>

                <div className="flex bg-card/50 p-1.5 rounded-2xl border border-border/40 w-full sm:w-fit shadow-inner">
                    <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab('fluxo')}
                        className={cn(
                            "flex-1 sm:flex-none text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-xl transition-all",
                            activeView === 'fluxo' ? "bg-primary/20 text-primary border border-primary/50 shadow-sm" : "text-muted-foreground hover:bg-muted/20"
                        )}
                    >
                        <History size={14} /> Fluxo do Período
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab('custos')}
                        className={cn(
                            "flex-1 sm:flex-none text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-xl transition-all",
                            activeView === 'custos' ? "bg-primary/20 text-primary border border-primary/50 shadow-sm" : "text-muted-foreground hover:bg-muted/20"
                        )}
                    >
                        <ArrowRightLeft size={14} /> Custos Fixos
                    </Button>
                </div>

                <div className="min-h-[400px]">
                    {activeView === 'fluxo' ? (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                                Extrato Analítico: {formattedPeriodHeader}
                            </h3>

                            <div className="space-y-2">
                                {loading ? (
                                    <div className="flex justify-center p-12"><Spinner /></div>
                                ) : filteredTransactions.length === 0 ? (
                                    <div className="text-center py-20 text-muted-foreground font-bold uppercase text-[9px] opacity-40 border-2 border-dashed rounded-3xl">
                                        Nenhum registro encontrado no período selecionado.
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
                                                className="group flex items-center p-4 rounded-xl bg-card border hover:border-primary/30 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                                                onClick={() => setSelectedTransaction(t)}
                                            >
                                                <div className={cn(
                                                    "mr-4 p-2 rounded-lg shrink-0", 
                                                    isExpense ? 'bg-red-500/10 text-red-500' : 
                                                    isSale ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                                                )}>
                                                    {isSale ? <ShoppingCart size={18} /> : isPayment ? <HandCoins size={18} /> : <TrendingDown size={18} />}
                                                </div>
                                                
                                                <div className="flex-grow min-w-0 pr-2">
                                                    <p className="font-bold text-sm truncate uppercase tracking-tight text-slate-100">
                                                        {t.description || (isSale ? `VENDA: ${t.tabName || 'BALCÃO'}` : t.type)}
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                                                        {format(dateVal, 'HH:mm')} • {t.paymentMethod || t.expenseCategory || 'Geral'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className={cn(
                                                        "font-black text-sm whitespace-nowrap", 
                                                        isExpense ? 'text-red-500' : 'text-emerald-400'
                                                    )}>
                                                        {isExpense ? '-' : '+'} R$ {Number(t.total || 0).toFixed(2)}
                                                    </span>
                                                    {isAdmin && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors" 
                                                            onClick={(e) => {e.stopPropagation(); setTransactionToDelete(t)}}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                                Master de Custos Fixos Cadastrados
                            </h3>

                            <div className="grid gap-3">
                                {(recurringExpenses || []).length === 0 ? (
                                    <div className="text-center py-20 bg-muted/10 border-2 border-dashed rounded-3xl">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-50">Nenhum plano de custo recorrente ativo.</p>
                                    </div>
                                ) : (
                                    recurringExpenses.map((expense) => (
                                        <div key={expense.id} className="p-5 rounded-2xl bg-card border border-dashed border-border/60 hover:border-primary/40 transition-colors shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                                        <Repeat size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm leading-none mb-1 uppercase tracking-tight">{expense.description}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[7px] font-black uppercase h-4 bg-muted/20 border-border/40">Vencimento: Dia {expense.dayOfMonth}</Badge>
                                                            <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">{expense.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-base font-black text-red-500">- R$ {Number(expense.amount || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 items-start shadow-inner">
                                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
                                    &quot;💡 Estratégia de Balcão: Custos fixos são rateados pelo Cockpit para calcular seu ponto de equilíbrio diário.&quot;
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                    <DialogContent className="sm:max-w-md bg-card border-border/40 rounded-3xl p-6 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
                                <TrendingDown className="text-red-500" /> REGISTRAR SAÍDA DE CAIXA
                            </DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4 py-4">
                                <div className="space-y-4">
                                    <FormItem>
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Tipo de Saída</Label>
                                        <Select onValueChange={(value: 'variable' | 'fixed') => { setExpenseType(value); setValue('category', ''); }} value={expenseType}>
                                            <FormControl><SelectTrigger className="h-12 bg-background border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent className="rounded-xl border-border/40">
                                                <SelectItem value="variable" className="font-bold uppercase text-[10px] py-3">Variável (Única)</SelectItem>
                                                <SelectItem value="fixed" className="font-bold uppercase text-[10px] py-3">Fixa (Recorrente)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                    
                                    <FormField control={control} name="description" render={({ field }) => (
                                        <FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Descrição</Label><FormControl><Input placeholder="Ex: Gelo, Gás, Manutenção..." required {...field} className="h-12 bg-background border-2 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    
                                    <FormField control={control} name="category" render={({ field }) => {
                                        const cats = expenseType === 'fixed' ? fixedCategories : variableCategories;
                                        return (
                                            <FormItem className="flex flex-col"><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Categoria Analítica</Label><FormControl>
                                                <Combobox 
                                                    options={Object.entries(cats).map(([v, l]) => ({ value: v, label: l }))} 
                                                    value={field.value} 
                                                    onChange={(val) => field.onChange(val)} 
                                                    placeholder="Escolha ou digite..." 
                                                    createLabel="Usar nova:" 
                                                />
                                            </FormControl><FormMessage /></FormItem>
                                        )
                                    }}/>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField control={control} name="amount" render={({ field }) => (
                                            <FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Valor (R$)</Label><FormControl><Input type="number" step="0.01" required {...field} className="h-12 bg-background border-2 rounded-xl font-black text-red-500 text-lg" /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={control} name="expenseDate" render={({ field }) => (
                                            <FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Data do Gasto</Label><FormControl><Input type="date" required {...field} className="h-12 bg-background border-2 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>

                                    {expenseType === 'fixed' && (
                                        <div className="p-4 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                            <FormField control={control} name="replicate" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between space-y-0">
                                                    <Label className="text-[9px] font-black uppercase text-primary tracking-widest">Gerar Recorrência</Label>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={(val) => { field.onChange(val); if(val) setValue('monthsToReplicate', '11'); }} />
                                                    </FormControl>
                                                </FormItem>
                                            )}/>
                                            {isReplicating && (
                                                <FormField control={control} name="monthsToReplicate" render={({ field }) => (
                                                    <FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground">Repetir por quantos meses?</Label><FormControl><Input type="number" {...field} className="h-10 bg-background border-2 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="pt-6 gap-2 border-t mt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} className="h-12 font-bold uppercase text-[10px] rounded-xl flex-1 border-border/40">Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="h-12 font-black uppercase text-xs shadow-lg bg-red-600 hover:bg-red-700 text-white rounded-xl flex-[2] shadow-red-900/20">
                                        {processing ? <Spinner size="h-4 w-4" /> : "Confirmar Saída"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                 
                {transactionToDelete && (
                    <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                        <AlertDialogContent className="rounded-3xl p-8 border-border/40 bg-card shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black uppercase text-red-500 tracking-tight text-lg">Anular Registro Financeiro?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed mt-2">
                                    Confirmar exclusão de &quot;{transactionToDelete.description || 'Transação'}&quot;? Esta ação removerá o registro e recalculará o lucro do período.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-2">
                                <AlertDialogCancel className="h-12 font-black uppercase text-[10px] rounded-xl border-border/40">Não, Manter</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteTransaction} className="h-12 font-black uppercase text-[10px] bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-lg shadow-red-900/20">
                                    {processing ? <Spinner size="h-4 w-4" /> : 'Sim, Anular'}
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
        </TooltipProvider>
    );
}
