'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { DateRange } from 'react-day-picker';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Trash2, History, TrendingUp, TrendingDown, Scale, Users, ShoppingCart, ArrowDownCircle, HandCoins } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { TransactionDetailModal } from '@/components/financials/transaction-detail-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
    
    const customersWithBalance = useMemo(() => (customers || []).filter(c => c.balance && c.balance > 0), [customers]);
    
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
            reset({ description: '', amount: '', expenseDate: date?.to?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0], category: '', replicate: false, monthsToReplicate: '11' });
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
    }

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
    }

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="p-1 md:p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-foreground flex items-center"><History className="mr-3" /> Financeiro</h2>
                 <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <DateRangePicker date={date} onDateChange={setDate} className="w-full sm:w-auto" />
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <Button variant={filter === 'income' ? 'secondary' : 'outline'} onClick={() => setFilter('income')} className="h-auto bg-card p-3 rounded-xl flex items-center text-left hover:bg-secondary"><TrendingUp className="text-accent mr-2 md:mr-4" size={24}/><div> <p className="text-xs md:text-sm text-muted-foreground">Entradas (Período)</p><p className="text-lg md:text-2xl font-bold text-accent">R$ {totalIncome.toFixed(2)}</p></div></Button>
                <Button variant={filter === 'expense' ? 'secondary' : 'outline'} onClick={() => setFilter('expense')} className="h-auto bg-card p-3 rounded-xl flex items-center text-left hover:bg-secondary"><TrendingDown className="text-destructive mr-2 md:mr-4" size={24}/><div ><p className="text-xs md:text-sm text-muted-foreground">Saídas (Período)</p><p className="text-lg md:text-2xl font-bold text-destructive">R$ {totalExpense.toFixed(2)}</p></div></Button>
                <Card className="p-3 rounded-xl flex items-center"><Scale className="text-primary mr-2 md:mr-4" size={24}/><div ><p className="text-xs md:text-sm text-muted-foreground">Saldo (Período)</p><p className="text-lg md:text-2xl font-bold text-primary">R$ {(totalIncome - totalExpense).toFixed(2)}</p></div></Card>
                <Button variant={filter === 'fiado' ? 'secondary' : 'outline'} onClick={() => setFilter('fiado')} className="h-auto bg-card p-3 rounded-xl flex items-center text-left hover:bg-secondary"><Users className="text-yellow-400 mr-2 md:mr-4" size={24}/><div ><p className="text-xs md:text-sm text-muted-foreground">A Receber (Total)</p><p className="text-lg md:text-2xl font-bold text-yellow-400">R$ {totalFiadoGeral.toFixed(2)}</p></div></Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Registrar Saída Financeira</CardTitle></CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4">
                                <FormItem>
                                    <FormLabel>Tipo de Saída</FormLabel>
                                    <Select onValueChange={(value: 'variable' | 'fixed') => {
                                        setExpenseType(value);
                                        form.setValue('category', '');
                                        if (value === 'variable') form.setValue('replicate', false);
                                    }} value={expenseType}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="variable">Despesa Variável/Operacional</SelectItem>
                                            <SelectItem value="fixed">Custo Fixo Mensal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Custos fixos são usados para calcular metas no Cockpit.
                                    </FormDescription>
                                </FormItem>
                                <FormField
                                    control={control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl><Input placeholder={expenseType === 'fixed' ? "Ex: Aluguel de Março" : "Ex: Compra de gelo"} required {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="category"
                                    render={({ field }) => {
                                        const categories = expenseType === 'fixed' ? fixedCategories : variableCategories;
                                        const categoryOptions = Object.entries(categories).map(([value, label]) => ({ value, label }));
                                        
                                        const handleCategoryChange = (value: string, isCreation?: boolean) => {
                                            field.onChange(value);
                                            if (isCreation) {
                                                if (expenseType === 'fixed') {
                                                    setFixedCategories(prev => ({...prev, [value]: value}));
                                                } else {
                                                    setVariableCategories(prev => ({...prev, [value]: value}));
                                                }
                                            }
                                        };
                                        
                                        return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Categoria</FormLabel>
                                                 <FormControl>
                                                    <Combobox
                                                        options={categoryOptions}
                                                        value={field.value}
                                                        onChange={handleCategoryChange}
                                                        placeholder="Selecione ou crie uma categoria"
                                                        createLabel="Criar nova categoria:"
                                                    />
                                                </FormControl>
                                                <FormMessage />
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
                                                <FormControl><Input type="number" step="0.01" placeholder="Ex: 150.00" required {...field} className="text-base" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="expenseDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data da Despesa</FormLabel>
                                                <FormControl><Input type="date" required {...field} className="text-base"/></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {expenseType === 'fixed' && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                        <FormField
                                            control={control}
                                            name="replicate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Replicar para meses subsequentes?</FormLabel>
                                                        <FormDescription>
                                                            Cria lançamentos futuros automaticamente.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        {isReplicating && (
                                            <FormField
                                                control={control}
                                                name="monthsToReplicate"
                                                render={({ field }) => (
                                                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <FormLabel>Quantidade de meses extras (ex: 11 para um ano total)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} className="bg-card" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                )}

                                <div><Button type="submit" disabled={processing} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/80 disabled:bg-muted-foreground">{processing ? <Spinner size="h-5 w-5"/> : "Adicionar Despesa"}</Button></div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>{getFilterTitle()}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-72">
                            <div className="space-y-1 pr-2">
                                {filteredList.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada.</p>
                                ) : (
                                    filteredList.map(item => {
                                        const transaction = item as Transaction;
                                        if (filter === 'fiado') {
                                            const customer = item as Customer;
                                            return (
                                                <div key={customer.id} className="flex items-center p-3 rounded-md">
                                                    <Users className="mr-4 text-yellow-400" size={20} />
                                                    <div className="flex-grow">
                                                        <p className="font-semibold">{customer.name}</p>
                                                        <p className="text-sm text-muted-foreground">{customer.contact}</p>
                                                    </div>
                                                    <div className="font-bold text-yellow-400">
                                                        R$ {(customer.balance || 0).toFixed(2)}
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
                                                description = customerName ? `Venda para ${customerName}` : 'Venda Avulsa';
                                                if (transaction.paymentMethod) {
                                                    subDescription += ` • ${transaction.paymentMethod}`;
                                                }
                                                break;
                                            case 'expense':
                                                icon = <ArrowDownCircle className="text-destructive" size={20} />;
                                                if (transaction.expenseCategory) {
                                                     subDescription += ` • ${transaction.expenseCategory}`;
                                                }
                                                break;
                                            case 'payment':
                                                icon = <HandCoins className="text-primary" size={20} />;
                                                 if (transaction.paymentMethod) {
                                                     subDescription += ` • ${transaction.paymentMethod}`;
                                                }
                                                break;
                                        }

                                        return (
                                            <div 
                                                key={transaction.id}
                                                className={`group flex items-center p-3 rounded-md ${hasItems ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                                                onClick={() => hasItems && handleRowClick(transaction)}
                                            >
                                                <div className="mr-4">{icon}</div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{description}</p>
                                                    <p className="text-sm text-muted-foreground">{subDescription}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`font-bold text-lg mr-2 ${amountColor}`}>
                                                        {transaction.type === 'expense' ? '-' : '+'} R$ {transaction.total.toFixed(2)}
                                                    </span>
                                                    {transaction.type === 'expense' && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => {e.stopPropagation(); setTransactionToDelete(transaction)}}>
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
            </div>
             
             {transactionToDelete && (
                <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação de <strong>{(transactionToDelete as Transaction).description}</strong> no valor de R$ {(transactionToDelete as Transaction).total.toFixed(2)}.
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
