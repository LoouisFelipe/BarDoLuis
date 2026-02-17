'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Customer, RecurringExpense } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { DateRange } from 'react-day-picker';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
    Trash2, 
    History, 
    TrendingUp, 
    TrendingDown, 
    Scale, 
    Users, 
    ShoppingCart, 
    ArrowDownCircle, 
    HandCoins, 
    PlusCircle,
    Info,
    CalendarClock,
    Repeat
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { TransactionDetailModal } from '@/components/financials/transaction-detail-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ExpenseFormData {
    description: string;
    amount: string;
    expenseDate: string;
    category: string;
    replicate: boolean;
    monthsToReplicate: string;
}

export const FinancialsTab: React.FC = () => {
    const { transactions, recurringExpenses, customers, loading, addExpense, deleteTransaction } = useData();
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>();
    const [filter, setFilter] = useState('all');
    
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [expenseType, setExpenseType] = useState<'variable' | 'fixed'>('variable');
    
    const [fixedCategories, setFixedCategories] = useState({ 'Aluguel': 'Aluguel', 'Contas Fixas': 'Contas Fixas (Água, Luz, etc)', 'Internet': 'Internet/Software' });
    const [variableCategories, setVariableCategories] = useState({ 'Insumos': 'Insumos & Fornecedores', 'Taxas de Cartão': 'Taxas de Cartão', 'Marketing': 'Marketing', 'Outros': 'Outros' });

    const form = useForm<ExpenseFormData>({
        defaultValues: { description: '', amount: '', expenseDate: '', category: '', replicate: false, monthsToReplicate: '11' }
    });
    const { handleSubmit, control, reset, setValue, watch } = form;
    const isReplicating = watch('replicate');

    const customerMap = useMemo(() => {
        const map = new Map<string, string>();
        (customers || []).forEach(c => c.id && map.set(c.id, c.name));
        return map;
    }, [customers]);
    
    useEffect(() => {
        const today = new Date();
        const fromDate = subDays(today, 6);
        setDate({ from: fromDate, to: today });
        setValue('expenseDate', today.toISOString().split('T')[0]);
    }, [setValue]);

    const filteredTransactions = useMemo(() => {
        if (!date?.from) return [];
        const interval = { start: startOfDay(date.from), end: endOfDay(date.to || date.from) };
        return transactions.filter(t => {
            const timestamp = (t.timestamp as any)?.toDate ? (t.timestamp as any).toDate() : t.timestamp;
            return isWithinInterval(timestamp, interval);
        });
    }, [transactions, date]);
    
    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.type === 'sale' && t.paymentMethod !== 'Fiado') {
                acc.totalIncome += t.total;
            } else if (t.type === 'payment') {
                acc.totalIncome += t.total;
            } else if (t.type === 'expense') {
                acc.totalExpense += t.total;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });
    }, [filteredTransactions]);

    const customersWithBalance = useMemo(() => (customers || []).filter(c => (c.balance || 0) > 0), [customers]);
    const totalFiadoGeral = useMemo(() => customersWithBalance.reduce((sum, c) => sum + (c.balance || 0), 0), [customersWithBalance]);

    const filteredList = useMemo(() => {
        const sortedTransactions = [...(filteredTransactions || [])].sort((a,b) => {
            const dateA = (a.timestamp as any)?.toDate ? (a.timestamp as any).toDate() : a.timestamp;
            const dateB = (b.timestamp as any)?.toDate ? (b.timestamp as any).toDate() : b.timestamp;
            return (dateB as Date).getTime() - (dateA as Date).getTime();
        });
        if (filter === 'all') return sortedTransactions;
        if (filter === 'income') return sortedTransactions.filter(t => (t.type === 'sale' && t.paymentMethod !== 'Fiado') || t.type === 'payment');
        if (filter === 'expense') return sortedTransactions.filter(t => t.type === 'expense');
        if (filter === 'sales') return sortedTransactions.filter(t => t.type === 'sale');
        if (filter === 'fiado') return customersWithBalance;
        if (filter === 'recurring') return recurringExpenses;
        return [];
    }, [filteredTransactions, filter, customersWithBalance, recurringExpenses]);

    const handleAddExpense = async (data: ExpenseFormData) => {
        const numAmount = parseFloat(data.amount);
        if (!data.description || !numAmount || numAmount <= 0 || !data.category) {
            toast({ title: "Campos Inválidos", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
            return;
        }
        setProcessing(true);
        try {
            const replicateCount = data.replicate ? (parseInt(data.monthsToReplicate, 10) || 0) : 0;
            await addExpense(data.description, numAmount, data.category, data.expenseDate, replicateCount);
            reset({ description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], category: '', replicate: false, monthsToReplicate: '11' });
            setIsExpenseModalOpen(false);
        } catch (error) {
            // Error handled by context
        } finally {
            setProcessing(false);
        }
    };
    
    const handleDeleteTransaction = async () => {
        if (!transactionToDelete?.id) return;
        setProcessing(true);
        try {
            await deleteTransaction(transactionToDelete.id);
        } catch (error) {
            // Error handled by context
        } finally {
            setProcessing(false);
            setTransactionToDelete(null);
        }
    };

    const getFilterTitle = () => {
        if (!date?.from) return "Carregando...";
        if (filter === 'recurring') return "Contratos de Custos Fixos (Recurring)";
        const fromDate = format(date.from, 'dd/MM/yy');
        const toDate = date.to ? format(date.to, 'dd/MM/yy') : fromDate;
        const period = fromDate === toDate ? fromDate : `de ${fromDate} a ${toDate}`;
        switch(filter) {
            case 'income': return `Entradas ${period}`;
            case 'expense': return `Saídas ${period}`;
            case 'sales': return `Vendas ${period}`;
            case 'fiado': return `Saldo Devedor`;
            default: return `Transações ${period}`;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <div className="p-1 md:p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <History size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Financeiro</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 leading-none">Gestão de Fluxo de Caixa • Tavares Bastos</p>
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <DateRangePicker date={date} onDateChange={setDate} className="w-full sm:w-auto" />
                    <Button onClick={() => setIsExpenseModalOpen(true)} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-xs h-11 gap-2 shadow-lg">
                        <PlusCircle size={18} /> Nova Despesa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <Button 
                    variant={filter === 'income' ? 'secondary' : 'outline'} 
                    onClick={() => setFilter('income')} 
                    className={cn("h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary border-2 transition-all group", filter === 'income' ? "border-accent" : "border-transparent")}
                >
                    <TrendingUp className="text-accent mr-3 hidden sm:block group-hover:scale-110 transition-transform" size={28}/>
                    <div> 
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Entradas</p>
                        <p className="text-xl md:text-2xl font-black text-accent">R$ {totals.totalIncome.toFixed(2)}</p>
                    </div>
                </Button>
                <Button 
                    variant={filter === 'expense' ? 'secondary' : 'outline'} 
                    onClick={() => setFilter('expense')} 
                    className={cn("h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary border-2 transition-all group", filter === 'expense' ? "border-destructive" : "border-transparent")}
                >
                    <TrendingDown className="text-destructive mr-3 hidden sm:block group-hover:scale-110 transition-transform" size={28}/>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Saídas</p>
                        <p className="text-xl md:text-2xl font-black text-destructive">R$ {totals.totalExpense.toFixed(2)}</p>
                    </div>
                </Button>
                <div className="bg-card p-4 rounded-xl flex items-center border-2 border-transparent">
                    <Scale className="text-primary mr-3 hidden sm:block" size={28}/>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Saldo</p>
                        <p className="text-xl md:text-2xl font-black text-primary">R$ {(totals.totalIncome - totals.totalExpense).toFixed(2)}</p>
                    </div>
                </div>
                <Button 
                    variant={filter === 'fiado' ? 'secondary' : 'outline'} 
                    onClick={() => setFilter('fiado')} 
                    className={cn("h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary border-2 transition-all group", filter === 'fiado' ? "border-yellow-400" : "border-transparent")}
                >
                    <Users className="text-yellow-400 mr-3 hidden sm:block group-hover:scale-110 transition-transform" size={28}/>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">A Receber</p>
                        <p className="text-xl md:text-2xl font-black text-yellow-400">R$ {totalFiadoGeral.toFixed(2)}</p>
                    </div>
                </Button>
            </div>

            {/* CEO: Atalho para gestão de custos fixos recorrentes */}
            <div className="flex bg-card/50 p-1.5 rounded-xl border border-border/40 w-full sm:w-auto overflow-hidden">
                <Button 
                    variant="ghost" 
                    onClick={() => setFilter('all')}
                    className={cn(
                        "flex-1 sm:flex-none text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-lg transition-all",
                        filter !== 'recurring' ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <History size={14} /> Fluxo de Caixa
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={() => setFilter('recurring')}
                    className={cn(
                        "flex-1 sm:flex-none text-[10px] font-black uppercase tracking-tight gap-2 px-6 h-10 rounded-lg transition-all",
                        filter === 'recurring' ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <Repeat size={14} /> Custos Fixos (Planos)
                </Button>
            </div>

            <Card className="shadow-2xl border-none bg-card overflow-hidden">
                <CardHeader className="border-b pb-4 bg-muted/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">{getFilterTitle()}</CardTitle>
                    {filter === 'recurring' && <CalendarClock size={20} className="text-primary opacity-50" />}
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[60vh]">
                        <div className="p-4 space-y-2">
                            {filteredList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <Info size={48} className="text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground font-bold uppercase text-xs opacity-50 tracking-widest italic">Nenhum registro encontrado.</p>
                                </div>
                            ) : (
                                filteredList.map(item => {
                                    if (filter === 'fiado') {
                                        const customer = item as Customer;
                                        return (
                                            <div key={customer.id} className="flex items-center p-4 rounded-xl bg-background border-2 border-transparent hover:border-yellow-400/40 transition-all shadow-sm">
                                                <div className="mr-4 p-3 bg-yellow-400/10 rounded-full text-yellow-400">
                                                    <Users size={24} />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-black text-sm">{customer.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{customer.contact || 'Sem contato'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">Dívida Ativa</p>
                                                    <p className="font-black text-xl text-yellow-400">R$ {(customer.balance || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (filter === 'recurring') {
                                        const recurring = item as RecurringExpense;
                                        return (
                                            <div key={recurring.id} className="flex items-center p-4 rounded-xl bg-background border-2 border-dashed hover:border-primary/40 transition-all group">
                                                <div className="mr-4 p-3 bg-primary/10 rounded-full text-primary">
                                                    <Repeat size={24} />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-black text-sm">{recurring.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0">Todo dia {recurring.dayOfMonth}</Badge>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-black">{recurring.category}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Valor Mensal</p>
                                                    <p className="font-black text-xl text-destructive">- R$ {recurring.amount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    const transaction = item as Transaction;
                                    const hasItems = transaction.items && transaction.items.length > 0;
                                    let icon = <Info className="text-muted-foreground" size={20} />;
                                    let desc = transaction.description || '';
                                    let sub = transaction.timestamp ? (transaction.timestamp as Date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '';
                                    const color = transaction.type === 'expense' ? 'text-destructive' : transaction.type === 'sale' ? 'text-accent' : 'text-primary';
                                    
                                    if (transaction.type === 'sale') {
                                        icon = <ShoppingCart className="text-accent" size={20} />;
                                        const cName = transaction.customerId ? customerMap.get(transaction.customerId) : null;
                                        desc = cName ? `Venda: ${cName}` : 'Venda Balcão';
                                        if (transaction.paymentMethod) sub += ` • ${transaction.paymentMethod}`;
                                    } else if (transaction.type === 'expense') {
                                        icon = transaction.recurringExpenseId ? <Repeat className="text-destructive" size={20} /> : <ArrowDownCircle className="text-destructive" size={20} />;
                                        if (transaction.expenseCategory) sub += ` • ${transaction.expenseCategory}`;
                                        if (transaction.recurringExpenseId) sub += ` [Custo Fixo]`;
                                    } else if (transaction.type === 'payment') {
                                        icon = <HandCoins className="text-primary" size={20} />;
                                        if (transaction.paymentMethod) sub += ` • ${transaction.paymentMethod}`;
                                    }
                                    
                                    return (
                                        <div key={transaction.id} className={cn("group flex items-center p-4 rounded-xl bg-background border-2 border-transparent transition-all shadow-sm", hasItems ? 'cursor-pointer hover:bg-muted/30 hover:border-primary/40' : 'hover:bg-muted/10')} onClick={() => { if(hasItems) setSelectedTransaction(transaction); }}>
                                            <div className="mr-4 p-2.5 bg-muted rounded-xl shadow-inner">{icon}</div>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-black text-sm truncate uppercase tracking-tight">{desc}</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">{sub}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className={cn("font-black text-lg whitespace-nowrap", color)}>
                                                        {transaction.type === 'expense' ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                                                    </span>
                                                </div>
                                                {transaction.type === 'expense' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity" onClick={(e) => {e.stopPropagation(); setTransactionToDelete(transaction)}}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent className="sm:max-w-md bg-card border-border/40">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight"><TrendingDown className="text-destructive" /> Registrar Saída</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">Controle de custos e gastos operacionais.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4 py-4">
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tipo de Saída</FormLabel>
                                <Select onValueChange={(value: 'variable' | 'fixed') => { setExpenseType(value); form.setValue('category', ''); }} value={expenseType}>
                                    <FormControl><SelectTrigger className="h-12 bg-background border-2 font-bold"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="variable" className="font-bold uppercase text-xs">Despesa Variável (Avulsa)</SelectItem>
                                        <SelectItem value="fixed" className="font-bold uppercase text-xs">Custo Fixo (Recorrente)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                            <FormField control={control} name="description" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descrição</FormLabel><FormControl><Input placeholder="Ex: Gelo, Limpeza, Internet..." required {...field} className="h-12 bg-background border-2 font-bold" /></FormControl></FormItem>
                            )}/>
                            <FormField control={control} name="category" render={({ field }) => {
                                const cats = expenseType === 'fixed' ? fixedCategories : variableCategories;
                                return (
                                    <FormItem className="flex flex-col"><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Categoria</FormLabel><FormControl><Combobox options={Object.entries(cats).map(([v, l]) => ({ value: v, label: l }))} value={field.value} onChange={(val, isCreation) => { field.onChange(val); if (isCreation) { if (expenseType === 'fixed') setFixedCategories(p => ({...p, [val]: val})); else setVariableCategories(p => ({...p, [val]: val})); } }} placeholder="Selecione..." createLabel="Criar:" /></FormControl></FormItem>
                                )
                            }}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" required {...field} className="h-12 bg-background border-2 font-black text-destructive text-lg" /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="expenseDate" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data Inicial</FormLabel><FormControl><Input type="date" required {...field} className="h-12 bg-background border-2 font-bold" /></FormControl></FormItem>
                                )}/>
                            </div>
                            {expenseType === 'fixed' && (
                                <div className="p-4 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 space-y-4">
                                    <FormField control={control} name="replicate" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between space-y-0">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Configurar Recorrência</FormLabel>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase leading-none">Cria um plano de custo fixo mensal.</p>
                                            </div>
                                            <FormControl>
                                                <Switch 
                                                    checked={field.value} 
                                                    onCheckedChange={(val) => { 
                                                        field.onChange(val); 
                                                        if(val) setValue('monthsToReplicate', '11'); 
                                                    }} 
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}/>
                                    {isReplicating && (
                                        <FormField control={control} name="monthsToReplicate" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">Quantos meses replicar?</FormLabel>
                                                <FormControl><Input type="number" {...field} className="h-10 bg-background border-2 font-bold" /></FormControl>
                                                <p className="text-[8px] text-primary font-bold uppercase italic">* Será criado um registro em 'Recurring Expenses' e {field.value} meses no ledger.</p>
                                            </FormItem>
                                        )}/>
                                    )}
                                </div>
                            )}
                            <DialogFooter className="pt-4 gap-2 flex-col sm:flex-row">
                                <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} className="h-12 font-black uppercase text-xs">Cancelar</Button>
                                <Button type="submit" disabled={processing} className="h-12 font-black uppercase text-sm shadow-lg bg-destructive hover:bg-destructive/90 text-white flex-1">
                                    {processing ? <Spinner size="h-4 w-4" /> : "Confirmar Saída"}
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
                            <AlertDialogTitle className="font-black uppercase text-destructive tracking-tight">Excluir Transação?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed">
                                Esta ação anulará o registro de <strong>{transactionToDelete.description}</strong>. {transactionToDelete.recurringExpenseId && "Nota: Esta é uma ocorrência de custo fixo. Deseja excluir apenas esta ou todo o plano? (Por enquanto apenas esta será removida)."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="h-12 font-black uppercase text-[10px]">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTransaction} className="h-12 font-black uppercase text-[10px] bg-destructive text-white hover:bg-destructive/90 shadow-lg">
                                {processing ? <Spinner /> : 'Sim, Anular'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {selectedTransaction && (
                <TransactionDetailModal transaction={selectedTransaction} open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)} />
            )}
        </div>
    );
};
