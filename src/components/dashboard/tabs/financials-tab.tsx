
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

/**
 * @fileOverview Aba Financeira do BarDoLuis.
 * CTO: Saneamento de sintaxe e centralização de permissões via useAuth.
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
            <div className="p-1 md:p-4 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <History className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none">Financeiro</h2>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.25em] mt-1">Gestão de Fluxo de Caixa &bull; Tavares Bastos</p>
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

                {activeView === 'fluxo' ? (
                    <div className="space-y-6">
                        <div className="pt-4">
                            <h3 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                Transações de {formattedPeriodHeader}
                            </h3>
                        </div>

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
                                                    {format(dateVal, 'HH:mm')} &bull; {t.paymentMethod || t.expenseCategory || 'Geral'}
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
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                Contratos de Custos Fixos
                            </h3>
                            <CalendarDays className="h-5 w-5 text-muted-foreground opacity-50" />
                        </div>

                        <div className="space-y-4">
                            {(recurringExpenses || []).length === 0 ? (
                                <div className="text-center py-20 bg-muted/10 border-2 border-dashed rounded-3xl">
                                    <Repeat className="h-12 w-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase text-muted-foreground opacity-50">Nenhum plano de custo fixo registrado.</p>
                                </div>
                            ) : (
                                recurringExpenses.map((expense) => (
                                    <div key={expense.id} className="group p-6 rounded-2xl bg-card/40 border-2 border-dashed border-border/40 hover:border-primary/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/5 rounded-xl text-primary border border-primary/10">
                                                    <Repeat size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg leading-none mb-2">{expense.description}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase bg-background">Todo dia {expense.dayOfMonth}</Badge>
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">{expense.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Valor Mensal</p>
                                                <p className="text-2xl font-black text-red-500">- R$ {Number(expense.amount || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex gap-4">
                            <Info size={20} className="text-primary shrink-0" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                                &quot;💡 Gestão Estratégica: Custos fixos são rateados diariamente pelo B.I. Cockpit para calcular sua meta de sobrevivência em tempo real.&quot;
                            </p>
                        </div>
                    </div>
                )}

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
                                            <SelectItem value="fixed" className="font-bold uppercase text-xs">Custo Fixo (Plano Mensal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                
                                <FormField control={control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descrição</FormLabel><FormControl><Input placeholder="Ex: Aluguel, Gelo, Limpeza..." required {...field} className="h-12 bg-background border-2 font-bold" /></FormControl><FormMessage /></FormItem>
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
                                        </FormControl><FormMessage /></FormItem>
                                    )
                                }}/>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={control} name="amount" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" required {...field} className="h-12 bg-background border-2 font-black text-red-500 text-lg" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={control} name="expenseDate" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data</FormLabel><FormControl><Input type="date" required {...field} className="h-12 bg-background border-2 font-bold" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>

                                {expenseType === 'fixed' && (
                                    <div className="p-4 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 space-y-4">
                                        <FormField control={control} name="replicate" render={({ field }) => (
                                            <FormItem className="flex items-center justify-between space-y-0">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Recorrência</FormLabel>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase leading-none">Agendar próximos meses</p>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={(val) => { field.onChange(val); if(val) setValue('monthsToReplicate', '11'); }} className="data-[state=checked]:bg-primary"/>
                                                </FormControl>
                                            </FormItem>
                                        )}/>
                                        {isReplicating && (
                                            <FormField control={control} name="monthsToReplicate" render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Repetir por quantos meses?</FormLabel><FormControl><Input type="number" {...field} className="h-10 bg-background border-2 font-bold" /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                        )}
                                    </div>
                                )}

                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase text-center">
                                        Dica do CTO: O sistema salva o plano em &quot;Custos Fixos&quot; para auditoria mensal automática.
                                    </p>
                                </div>

                                <DialogFooter className="pt-4 gap-2 flex-col sm:flex-row">
                                    <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} className="h-12 font-bold uppercase text-xs">Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="h-12 font-black uppercase text-sm shadow-lg bg-red-600 hover:bg-red-700 text-white flex-1">
                                        {processing ? <Spinner size="h-4 w-4" /> : "Gravar Saída"}
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
                                    {processing ? <Spinner size="h-4 w-4" /> : 'Confirmar Anulação'}
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
