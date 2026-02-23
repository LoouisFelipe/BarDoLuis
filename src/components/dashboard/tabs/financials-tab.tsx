
'use client';

import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { TrendingUp, TrendingDown, History, Scale, Users, PlusCircle, ArrowRightLeft, Trash2, Repeat, ShoppingCart, CheckCircle2, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner'; 
import { Combobox } from '@/components/ui/combobox';
import { TransactionDetailModal } from '@/components/financials/transaction-detail-modal'; 
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';

/**
 * @fileOverview Aba Financeira Master com Suporte a Contas a Pagar.
 * CTO: Implementação de Status 'Pendente' e Motor de Liquidação Instantânea.
 */
export function FinancialsTab() {
    const { transactions, customers, recurringExpenses, loading, addExpense, markTransactionAsPaid, deleteTransaction } = useData();
    const { isAdmin } = useAuth(); 
    
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const [processing, setProcessing] = useState(false);
    const [activeView, setActiveTab] = useState<'fluxo' | 'custos'>('fluxo');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({ from: subDays(new Date(), 6), to: new Date() }));

    const fixedCategories = { 'aluguel': 'Aluguel', 'luz': 'Energia Elétrica', 'agua': 'Água/Esgoto', 'internet': 'Internet', 'funcionarios': 'Salários' };
    const variableCategories = { 'fornecedor': 'Fornecedor Bebidas', 'manutencao': 'Manutenção', 'limpeza': 'Limpeza', 'extra': 'Extra/Outros' };

    const form = useForm({ defaultValues: { description: '', amount: '', category: '', expenseDate: new Date().toISOString().split('T')[0], replicate: false, monthsToReplicate: '11', isPaid: true } });
    const { control, handleSubmit, setValue, watch } = form;
    const isReplicating = watch('replicate');
    const isPaidNow = watch('isPaid');
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
        let income = 0, expense = 0, payable = 0;
        filteredTransactions.forEach(t => {
            const val = Number(t.total) || 0;
            const isPaid = t.status !== 'pending';

            if (t.type === 'sale' || t.type === 'payment') {
                income += val;
            } else if (t.type === 'expense') {
                if (isPaid) expense += val;
                else payable += val;
            }
        });
        const accountsReceivable = (customers || []).reduce((acc, c) => acc + (c.balance || 0), 0);
        return { 
            income, 
            expense, 
            payable,
            balance: income - expense, 
            receivable: accountsReceivable 
        };
    }, [filteredTransactions, customers]);

    const handleAddExpense = async (data: any) => {
        setProcessing(true);
        try {
            const amountVal = parseFloat(data.amount);
            const status = data.isPaid ? 'paid' : 'pending';
            const replicateCount = (expenseType === 'fixed' && data.replicate) ? parseInt(data.monthsToReplicate) : 0;
            await addExpense(data.description, amountVal, data.category || 'Geral', data.expenseDate, replicateCount, status);
            setIsExpenseModalOpen(false);
            form.reset();
        } finally { setProcessing(false); }
    };

    const handleMarkAsPaid = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setProcessing(true);
        try {
            await markTransactionAsPaid(id);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete?.id) return;
        setProcessing(true);
        try { await deleteTransaction(transactionToDelete.id); setTransactionToDelete(null); } finally { setProcessing(false); }
    };

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-5 rounded-2xl border">
                    <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-xl text-primary"><History size={24} /></div><div><h2 className="text-2xl font-black uppercase tracking-tight">Financeiro</h2><p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Fluxo & Custos</p></div></div>
                    <div className="flex items-center gap-2 w-full md:w-auto"><DateRangePicker date={dateRange} onDateChange={setDateRange} className="flex-grow h-12 rounded-xl" /><Button onClick={() => setIsExpenseModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-black h-12 uppercase text-[10px] gap-2 px-4 rounded-xl"><PlusCircle size={16} /> Nova Saída</Button></div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-emerald-500/5 border-emerald-500/20 p-4 rounded-2xl"><div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-emerald-500" /><span className="text-[9px] font-black uppercase text-muted-foreground">Entradas</span></div><div className="text-xl font-black text-emerald-400">R$ {stats.income.toFixed(2)}</div></Card>
                    <Card className="bg-red-500/5 border-red-500/20 p-4 rounded-2xl"><div className="flex items-center gap-2 mb-1"><TrendingDown size={14} className="text-red-500" /><span className="text-[9px] font-black uppercase text-muted-foreground">Saídas Pagas</span></div><div className="text-xl font-black text-red-500">R$ {stats.expense.toFixed(2)}</div></Card>
                    <Card className="bg-orange-500/5 border-orange-500/20 p-4 rounded-2xl"><div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-orange-500" /><span className="text-[9px] font-black uppercase text-muted-foreground">A Pagar</span></div><div className="text-xl font-black text-orange-400">R$ {stats.payable.toFixed(2)}</div></Card>
                    <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl"><div className="flex items-center gap-2 mb-1"><Scale size={14} className="text-primary" /><span className="text-[9px] font-black uppercase text-muted-foreground">Líquido Atual</span></div><div className="text-xl font-black text-primary">R$ {stats.balance.toFixed(2)}</div></Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20 p-4 rounded-2xl col-span-2 lg:col-span-1"><div className="flex items-center gap-2 mb-1"><Users size={14} className="text-yellow-500" /><span className="text-[9px] font-black uppercase text-muted-foreground">A Receber</span></div><div className="text-xl font-black text-yellow-400">R$ {stats.receivable.toFixed(2)}</div></Card>
                </div>

                <div className="flex bg-card/50 p-1.5 rounded-2xl border w-full sm:w-fit"><Button variant="ghost" onClick={() => setActiveTab('fluxo')} className={cn("flex-1 text-[10px] font-black uppercase gap-2 px-6 h-10 rounded-xl", activeView === 'fluxo' ? "bg-primary/20 text-primary" : "text-muted-foreground")}><History size={14} /> Fluxo</Button><Button variant="ghost" onClick={() => setActiveTab('custos')} className={cn("flex-1 text-[10px] font-black uppercase gap-2 px-6 h-10 rounded-xl", activeView === 'custos' ? "bg-primary/20 text-primary" : "text-muted-foreground")}><ArrowRightLeft size={14} /> Custos</Button></div>
                
                <div className="min-h-[400px]">
                    {activeView === 'fluxo' ? (
                        <div className="space-y-4">
                            {filteredTransactions.map((t: any) => {
                                const dateVal = t.timestamp instanceof Date ? t.timestamp : t.timestamp?.toDate?.() || new Date();
                                const isExpense = t.type === 'expense';
                                const isPending = t.status === 'pending';
                                
                                return (
                                    <div 
                                        key={t.id} 
                                        className={cn(
                                            "group flex items-center p-4 rounded-xl bg-card border transition-all cursor-pointer",
                                            isPending ? "border-dashed border-orange-500/40 hover:border-orange-500" : "hover:border-primary/30"
                                        )}
                                        onClick={() => setSelectedTransaction(t)}
                                    >
                                        <div className={cn(
                                            "mr-4 p-2 rounded-lg", 
                                            isExpense ? (isPending ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500') : 'bg-emerald-500/10 text-emerald-500'
                                        )}>
                                            {t.type === 'sale' ? <ShoppingCart size={18} /> : <TrendingDown size={18} />}
                                        </div>
                                        <div className="flex-grow pr-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm truncate uppercase text-slate-100">{t.description || t.tabName || 'Venda'}</p>
                                                {isPending && <Badge variant="outline" className="text-[7px] font-black uppercase border-orange-500 text-orange-500 h-4 px-1.5 bg-orange-500/5">Pendente</Badge>}
                                            </div>
                                            <p className="text-[9px] text-muted-foreground/60 font-bold uppercase">{format(dateVal, 'HH:mm')} • {t.paymentMethod || t.expenseCategory || 'Geral'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("font-black text-sm", isExpense ? (isPending ? 'text-orange-400' : 'text-red-500') : 'text-emerald-400')}>
                                                {isExpense ? '-' : '+'} R$ {Number(t.total || 0).toFixed(2)}
                                            </span>
                                            {isPending && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => handleMarkAsPaid(e, t.id)}
                                                    title="Marcar como Pago"
                                                    className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </Button>
                                            )}
                                            {isAdmin && <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); setTransactionToDelete(t)}} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></Button>}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredTransactions.length === 0 && (
                                <div className="py-20 text-center opacity-20 italic font-black uppercase text-xs tracking-[0.2em]">Nenhum registro no período</div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {(recurringExpenses || []).map((exp) => (
                                <div key={exp.id} className="p-5 rounded-2xl bg-card border border-dashed hover:border-primary/40 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/5 rounded-lg text-primary"><Repeat size={18} /></div>
                                            <div><h4 className="font-bold text-sm mb-1 uppercase">{exp.description}</h4><Badge variant="outline" className="text-[7px] font-black uppercase bg-muted/20">Dia {exp.dayOfMonth}</Badge></div>
                                        </div>
                                        <p className="text-base font-black text-red-500">- R$ {Number(exp.amount || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isExpenseModalOpen && (
                    <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                        <DialogContent className="sm:max-w-md bg-card rounded-3xl p-6">
                            <DialogHeader><DialogTitle className="font-black uppercase text-base">REGISTRAR SAÍDA</DialogTitle></DialogHeader>
                            <Form {...form}>
                                <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4 py-4">
                                    <div className="space-y-4">
                                        <FormItem>
                                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Tipo</Label>
                                            <Select onValueChange={(v: any) => { setExpenseType(v); setValue('category', ''); }} value={expenseType}>
                                                <FormControl><SelectTrigger className="h-12 bg-background rounded-xl font-bold"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent><SelectItem value="variable" className="font-bold text-[10px]">Variável (Única)</SelectItem><SelectItem value="fixed" className="font-bold text-[10px]">Fixa (Recorrente)</SelectItem></SelectContent>
                                            </Select>
                                        </FormItem>
                                        
                                        <FormField control={control} name="description" render={({ field }) => (<FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground">Descrição</Label><FormControl><Input placeholder="Ex: Gelo, Gás..." required {...field} className="h-12 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={control} name="category" render={({ field }) => (<FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground">Categoria</Label><FormControl><Combobox options={Object.entries(expenseType === 'fixed' ? fixedCategories : variableCategories).map(([v, l]) => ({ value: v, label: l }))} value={field.value} onChange={(v) => field.onChange(v)} placeholder="Escolha..." createLabel="Nova:" /></FormControl><FormMessage /></FormItem>)}/>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField control={control} name="amount" render={({ field }) => (<FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground">Valor (R$)</Label><FormControl><Input type="number" step="0.01" required {...field} className="h-12 rounded-xl font-black text-red-500" /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={control} name="expenseDate" render={({ field }) => (<FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground">Data</Label><FormControl><Input type="date" required {...field} className="h-12 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>)} />
                                        </div>

                                        <div className={cn(
                                            "p-4 border-2 border-dashed rounded-2xl transition-colors",
                                            isPaidNow ? "border-primary/20 bg-primary/5" : "border-orange-500/20 bg-orange-500/5"
                                        )}>
                                            <FormField control={control} name="isPaid" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className={cn("text-[9px] font-black uppercase", isPaidNow ? "text-primary" : "text-orange-500")}>
                                                            {isPaidNow ? "Paga Agora" : "Pagar Depois (Pendente)"}
                                                        </Label>
                                                        <p className="text-[8px] text-muted-foreground uppercase">Define se abate do saldo agora</p>
                                                    </div>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>

                                        {expenseType === 'fixed' && (
                                            <div className="p-4 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 space-y-3">
                                                <FormField control={control} name="replicate" render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between">
                                                        <Label className="text-[9px] font-black uppercase text-primary">Repetir Mensalmente</Label>
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                {isReplicating && (<FormField control={control} name="monthsToReplicate" render={({ field }) => (<FormItem><Label className="text-[9px] font-black uppercase text-muted-foreground">Quantidade de Meses</Label><FormControl><Input type="number" {...field} className="h-10 rounded-xl" /></FormControl></FormItem>)} />)}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter className="pt-6 border-t">
                                        <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} className="h-12 flex-1">Cancelar</Button>
                                        <Button type="submit" disabled={processing} className={cn("h-12 text-white rounded-xl flex-[2] font-black shadow-lg transition-all", isPaidNow ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700")}>
                                            {processing ? <Spinner size="h-4 w-4" /> : isPaidNow ? "Confirmar Saída" : "Agendar Pagamento"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
                
                {transactionToDelete && (
                    <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
                        <AlertDialogContent className="rounded-3xl p-8">
                            <AlertDialogHeader><AlertDialogTitle className="font-black uppercase text-red-500">Anular Registro?</AlertDialogTitle><AlertDialogDescription className="text-xs font-bold uppercase leading-relaxed mt-2">Deseja remover este lançamento definitivamente?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-2"><AlertDialogCancel className="h-12">Não</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTransaction} className="h-12 bg-red-600 text-white font-black">Sim, Anular</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                {selectedTransaction && (<TransactionDetailModal transaction={selectedTransaction} open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)} />)}
            </div>
        </TooltipProvider>
    );
}
