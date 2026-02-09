'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Customer } from '@/lib/schemas';
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
    Info
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

interface ExpenseFormData {
    description: string;
    amount: string;
    expenseDate: string;
    category: string;
    replicate: boolean;
    monthsToReplicate: string;
}

export const FinancialsTab: React.FC = () => {
    const { transactions, customers, loading, addExpense, deleteTransaction } = useData();
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>();
    const [filter, setFilter] = useState('all');
    
    // UI States
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [expenseType, setExpenseType] = useState<'variable' | 'fixed'>('variable');
    
    const [fixedCategories, setFixedCategories] = useState({ 'Aluguel': 'Aluguel', 'Contas Fixas': 'Contas Fixas (Água, Luz, etc)' });
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
    
    const { totalIncome, totalExpense } = useMemo(() => {
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
            return dateB.getTime() - dateA.getTime();
        });
        if (filter === 'all') return sortedTransactions;
        if (filter === 'income') return sortedTransactions.filter(t => (t.type === 'sale' && t.paymentMethod !== 'Fiado') || t.type === 'payment');
        if (filter === 'expense') return sortedTransactions.filter(t => t.type === 'expense');
        if (filter === 'sales') return sortedTransactions.filter(t => t.type === 'sale');
        if (filter === 'fiado') return customersWithBalance;
        return [];
    }, [filteredTransactions, filter, customersWithBalance]);

    const handleAddExpense = async (data: ExpenseFormData) => {
        const numAmount = parseFloat(data.amount);
        if (!data.description || !numAmount || numAmount <= 0 || !data.category) {
            toast({
                title: "Campos Inválidos",
                description: "Por favor, preencha todos os campos obrigatórios.",
                variant: "destructive",
            });
            return;
        }
        
        setProcessing(true);
        try {
            const replicateCount = data.replicate ? (parseInt(data.monthsToReplicate, 10) || 0) : 0;
            await addExpense(data.description, numAmount, data.category, data.expenseDate, replicateCount);
            reset({ 
                description: '', 
                amount: '', 
                expenseDate: new Date().toISOString().split('T')[0], 
                category: '', 
                replicate: false, 
                monthsToReplicate: '11' 
            });
            setIsExpenseModalOpen(false);
        } catch (error) {
           console.error("Erro ao adicionar despesa.", error);
        } finally {
            setProcessing(false);
        }
    };
    
    const handleDeleteTransaction = async () => {
        if (!transactionToDelete || !transactionToDelete.id) return;
        setProcessing(true);
        try {
            await deleteTransaction(transactionToDelete.id);
        } catch (error) {
            console.error("Ocorreu um erro ao excluir a transação.", error);
        } finally {
            setProcessing(false);
            setTransactionToDelete(null);
        }
    };

    const handleRowClick = (item: Transaction | Customer) => {
        const transaction = item as Transaction;
        if(transaction.items && transaction.items.length > 0) {
            setSelectedTransaction(transaction);
        }
    };

    const getFilterTitle = () => {
        if (!date?.from) return "Carregando...";
        const fromDate = format(date.from, 'dd/MM/yy');
        const toDate = date.to ? format(date.to, 'dd/MM/yy') : fromDate;
        const period = fromDate === toDate ? fromDate : `de ${fromDate} a ${toDate}`;

        switch(filter) {
            case 'income': return `Entradas (Recebimentos) ${period}`;
            case 'expense': return `Saídas (Despesas) ${period}`;
            case 'sales': return `Vendas ${period}`;
            case 'fiado': return `Clientes com Saldo Devedor (Total)`;
            default: return `Todas as Transações ${period}`;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="p-1 md:p-4 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-3xl font-bold text-foreground flex items-center">
                        <History className="mr-3 text-primary" /> Financeiro
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Gestão de Fluxo de Caixa e Inadimplência</p>
                </div>
                 <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <DateRangePicker date={date} onDateChange={setDate} className="w-full sm:w-auto" />
                    <Button onClick={() => setIsExpenseModalOpen(true)} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-bold gap-2">
                        <PlusCircle size={18} /> Nova Despesa
                    </Button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <Button 
                    variant={filter === 'income' ? 'secondary' : 'outline'} 
                    onClick={() => setFilter('income')} 
                    className={cn(
                        "h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary border-2 transition-all",
                        filter === 'income' ? "border-accent" : "border-transparent"
                    )}
                >
                    <TrendingUp className="text-accent mr-3 md:mr-4 hidden sm:block" size={28}/>
                    <div> 
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Entradas (Período)</p>
                        <p className="text-xl md:text-2xl font-black text-accent">R$ {totalIncome.toFixed(2)}</p>
                    </div>
                </Button>

                <Button 
                    variant={filter === 'expense' ? 'secondary' : 'outline'} 
                    onClick={() => setFilter('expense')} 
                    className={cn(
                        "h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary border-2 transition-all",
                        filter === 'expense' ? "border-destructive" : "border-transparent"
                    )}
                >
                    <TrendingDown className="text-destructive mr-3 md:mr-4 hidden sm:block" size={28}/>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Saídas (Período)</p>
                        <p className="text-xl md:text-2xl font-black text-destructive">R$ {totalExpense.toFixed(2)}</p>
                    </div>
                </Button>

                <div className="bg-card p-4 rounded-xl flex items-center border-2 border-transparent">
                    <Scale className="text-primary mr-3 md:mr-4 hidden sm:block" size={28}/>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Saldo (Período)</p>
                        <p className="text-xl md:text-2xl font-black text-primary">R$ {(totalIncome - totalExpense).toFixed(2)}</p>
                    </div>
                </div>

                <Button 
                    variant={filter === 'fiado' ? 'secondary' : 'outline'} 
                    onClick={() => setFilter('fiado')} 
                    className={cn(
                        "h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary border-2 transition-all",
                        filter === 'fiado' ? "border-yellow-400" : "border-transparent"
                    )}
                >
                    <Users className="text-yellow-400 mr-3 md:mr-4 hidden sm:block" size={28}/>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">A Receber (Total)</p>
                        <p className="text-xl md:text-2xl font-black text-yellow-400">R$ {totalFiadoGeral.toFixed(2)}</p>
                    </div>
                </Button>
            </div>

            {/* Main Content Area */}
            <Card className="shadow-lg border-none bg-card">
                <CardHeader className="border-b pb-4 bg-muted/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl">{getFilterTitle()}</CardTitle>
                            <CardDescription>Detalhamento de todas as movimentações financeiras registradas.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[60vh]">
                        <div className="p-4 space-y-2">
                            {filteredList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <Info size={48} className="text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground font-medium">Nenhuma transação encontrada para este filtro ou período.</p>
                                </div>
                            ) : (
                                filteredList.map(item => {
                                    const transaction = item as Transaction;
                                    
                                    if (filter === 'fiado') {
                                        const customer = item as Customer;
                                        return (
                                            <div key={customer.id} className="flex items-center p-4 rounded-lg bg-background border hover:border-yellow-400 transition-colors">
                                                <Users className="mr-4 text-yellow-400" size={24} />
                                                <div className="flex-grow">
                                                    <p className="font-bold text-sm">{customer.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{customer.contact || 'Sem contato registrado'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Saldo devedor</p>
                                                    <p className="font-black text-xl text-yellow-400">R$ {(customer.balance || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    const hasItems = transaction.items && transaction.items.length > 0;
                                    let icon;
                                    let description = transaction.description || '';
                                    let subDescription = transaction.timestamp ? (transaction.timestamp as Date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '';
                                    const amountColor = transaction.type === 'expense' ? 'text-destructive' : transaction.type === 'sale' ? 'text-accent' : 'text-primary';

                                    switch (transaction.type) {
                                        case 'sale':
                                            icon = <ShoppingCart className="text-accent" size={20} />;
                                            const customerName = transaction.customerId ? customerMap.get(transaction.customerId) : null;
                                            description = customerName ? `Venda: ${customerName}` : 'Venda de Balcão';
                                            if (transaction.paymentMethod) subDescription += ` • ${transaction.paymentMethod}`;
                                            break;
                                        case 'expense':
                                            icon = <ArrowDownCircle className="text-destructive" size={20} />;
                                            if (transaction.expenseCategory) subDescription += ` • ${transaction.expenseCategory}`;
                                            break;
                                        case 'payment':
                                            icon = <HandCoins className="text-primary" size={20} />;
                                            if (transaction.paymentMethod) subDescription += ` • ${transaction.paymentMethod}`;
                                            break;
                                    }

                                    return (
                                        <div 
                                            key={transaction.id}
                                            className={cn(
                                                "group flex items-center p-4 rounded-lg bg-background border transition-all",
                                                hasItems ? 'cursor-pointer hover:bg-muted/30 hover:border-primary' : 'hover:bg-muted/10'
                                            )}
                                            onClick={() => hasItems && handleRowClick(transaction)}
                                        >
                                            <div className="mr-4 p-2 bg-muted rounded-full">{icon}</div>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-bold text-sm truncate">{description}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{subDescription}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className={cn("font-black text-lg", amountColor)}>
                                                        {transaction.type === 'expense' ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                                                    </span>
                                                </div>
                                                {transaction.type === 'expense' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={(e) => {e.stopPropagation(); setTransactionToDelete(transaction)}}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Modal de Nova Despesa */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingDown className="text-destructive" /> Registrar Saída
                        </DialogTitle>
                        <DialogDescription>Preencha os dados da despesa para atualizar o fluxo de caixa.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4 py-4">
                            <FormItem>
                                <FormLabel>Tipo de Saída</FormLabel>
                                <Select onValueChange={(value: 'variable' | 'fixed') => {
                                    setExpenseType(value);
                                    form.setValue('category', '');
                                    if (value === 'variable') form.setValue('replicate', false);
                                }} value={expenseType}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="variable">Despesa Variável (Insumos, Manutenção)</SelectItem>
                                        <SelectItem value="fixed">Custo Fixo (Aluguel, Luz, etc)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                            
                            <FormField
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl><Input placeholder="Ex: Compra de Gelo" required {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="category"
                                render={({ field }) => {
                                    const categories = expenseType === 'fixed' ? fixedCategories : variableCategories;
                                    const categoryOptions = Object.entries(categories).map(([value, label]) => ({ value, label }));
                                    return (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Categoria</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={categoryOptions}
                                                    value={field.value}
                                                    onChange={(val, isCreation) => {
                                                        field.onChange(val);
                                                        if (isCreation) {
                                                            if (expenseType === 'fixed') setFixedCategories(prev => ({...prev, [val]: val}));
                                                            else setVariableCategories(prev => ({...prev, [val]: val}));
                                                        }
                                                    }}
                                                    placeholder="Selecione ou crie..."
                                                    createLabel="Criar categoria:"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )
                                }}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor (R$)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" placeholder="0.00" required {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expenseDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data</FormLabel>
                                            <FormControl><Input type="date" required {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {expenseType === 'fixed' && (
                                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                                    <FormField
                                        control={control}
                                        name="replicate"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <div className="space-y-0.5"><FormLabel>Replicar mensalmente?</FormLabel></div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    {isReplicating && (
                                        <FormField
                                            control={control}
                                            name="monthsToReplicate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantos meses?</FormLabel>
                                                    <FormControl><Input type="number" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            )}

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={processing} className="bg-destructive text-white">
                                    {processing ? <Spinner size="h-4 w-4"/> : "Confirmar Despesa"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
             
             {/* Alert Deletar */}
             {transactionToDelete && (
                <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Transação?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação removerá permanentemente o lançamento de <strong>{transactionToDelete.description}</strong> no valor de R$ {transactionToDelete.total.toFixed(2)}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive hover:bg-destructive/80">
                                {processing ? <Spinner /> : 'Confirmar Exclusão'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Modal Detalhes */}
            {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    open={!!selectedTransaction}
                    onOpenChange={() => setSelectedTransaction(null)}
                />
            )}
        </div>
    );
};