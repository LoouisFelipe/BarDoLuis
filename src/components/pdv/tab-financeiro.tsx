
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { getDb, appId, collection, addDoc } from '@/lib/firebase';

import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';


import { History, TrendingUp, TrendingDown, Scale, Users } from 'lucide-react';

const FechamentoCaixaModal = ({ open, onOpenChange, dailyTransactions }) => {
    const totais = useMemo(() => {
        const resumo = { Dinheiro: 0, PIX: 0, Débito: 0, Crédito: 0, Fiado: 0 };
        dailyTransactions.forEach(t => {
            if (t.type === 'sale') {
                if (resumo.hasOwnProperty(t.paymentMethod)) {
                    resumo[t.paymentMethod] += t.total;
                }
            } else if (t.type === 'payment') {
                resumo['Dinheiro'] += t.total;
            }
        });
        return resumo;
    }, [dailyTransactions]);

    const totalGeral = Object.values(totais).reduce((a, b) => a + b, 0);

    const handlePrint = () => {
        window.print();
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div id="printable-area">
                    <DialogHeader>
                        <DialogTitle>🧾 Fechamento de Caixa</DialogTitle>
                        <DialogDescription>Resumo do dia: {new Date().toLocaleDateString('pt-BR')}</DialogDescription>
                    </DialogHeader>
                    <div className="bg-secondary p-4 rounded-lg space-y-2 mt-4">
                        {Object.entries(totais).map(([forma, valor]) => (
                            <div key={forma} className="flex justify-between text-lg">
                                <span className="text-muted-foreground">{forma}</span>
                                <span className="font-semibold text-foreground">R$ {valor.toFixed(2)}</span>
                            </div>
                        ))}
                        <hr className="border-border my-2"/>
                        <div className="flex justify-between font-bold text-xl text-green-400 pt-2">
                            <span>Total Geral</span><span>R$ {totalGeral.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                 <Button onClick={handlePrint} className="w-full mt-6 print:hidden">
                    <Printer className="mr-2" size={20} /> Imprimir Relatório
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export const TabFinanceiro = ({ transactions, customers, loading, userId, showNotification }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [date, setDate] = useState('');
    const [isFechamentoModalOpen, setIsFechamentoModalOpen] = useState(false);

    useEffect(() => {
        setDate(new Date().toISOString().split('T')[0]);
    }, []);

    const dailyTransactions = useMemo(() => {
        if (!date || !transactions) return [];
        return transactions.filter(t => t.timestamp?.toDate().toISOString().split('T')[0] === date);
    }, [transactions, date]);

    const { totalIncome, totalExpense, totalFiado } = useMemo(() => {
        let income = 0;
        let expense = 0;
        dailyTransactions.forEach(t => {
            if ((t.type === 'sale' && t.paymentMethod !== 'Fiado') || t.type === 'payment') income += t.total;
            else if (t.type === 'expense') expense += t.total;
        });
        const fiado = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
        return { totalIncome: income, totalExpense: expense, totalFiado: fiado };
    }, [dailyTransactions, customers]);
    
    const filteredList = useMemo(() => {
        if (filter === 'all') return dailyTransactions.sort((a,b) => b.timestamp.toDate() - a.timestamp.toDate());
        if (filter === 'income') return dailyTransactions.filter(t => t.type === 'sale' || t.type === 'payment').sort((a,b) => b.timestamp.toDate() - a.timestamp.toDate());
        if (filter === 'expense') return dailyTransactions.filter(t => t.type === 'expense').sort((a,b) => b.timestamp.toDate() - a.timestamp.toDate());
        if (filter === 'fiado') return customers.filter(c => c.balance > 0);
        return [];
    }, [dailyTransactions, filter, customers]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const db = getDb();
        if (!db || !description || !amount || parseFloat(amount) <= 0) return;
        setProcessing(true);
        const expenseData = { description, total: parseFloat(amount), timestamp: new Date(), type: 'expense' };
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/transactions`), expenseData);
            showNotification("Despesa adicionada com sucesso!", "success");
            setDescription(''); setAmount('');
        } catch (error) {
            console.error("Erro ao adicionar despesa:", error);
            showNotification("Erro ao adicionar despesa.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const getFilterTitle = () => {
        if (!date) return "Carregando...";
        const dateFormatted = new Date(date + 'T03:00:00').toLocaleDateString('pt-BR');
        switch(filter) {
            case 'income': return `Detalhes das Entradas de ${dateFormatted}`;
            case 'expense': return `Detalhes das Saídas de ${dateFormatted}`;
            case 'fiado': return `Clientes com Saldo Devedor`;
            default: return `Todas as Transações de ${dateFormatted}`;
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-foreground flex items-center"><History className="mr-3" /> Financeiro</h2>
                 <div className="flex items-center gap-4">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary text-foreground p-2 rounded-lg w-48"/>
                    <Button onClick={() => setIsFechamentoModalOpen(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80">
                        <Printer className="mr-2" size={20} /> Fechar Caixa
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => setFilter('income')} className="h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary"><TrendingUp className="text-green-400 mr-4" size={32}/><div> <p className="text-sm text-muted-foreground">Entradas do Dia</p><p className="text-2xl font-bold text-green-400">R$ {totalIncome.toFixed(2)}</p></div></Button>
                <Button variant="outline" onClick={() => setFilter('expense')} className="h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary"><TrendingDown className="text-red-400 mr-4" size={32}/><div ><p className="text-sm text-muted-foreground">Saídas do Dia</p><p className="text-2xl font-bold text-red-400">R$ {totalExpense.toFixed(2)}</p></div></Button>
                <Card className="p-4 rounded-xl flex items-center"><Scale className="text-blue-400 mr-4" size={32}/><div ><p className="text-sm text-muted-foreground">Saldo do Dia</p><p className="text-2xl font-bold text-blue-400">R$ {(totalIncome - totalExpense).toFixed(2)}</p></div></Card>
                <Button variant="outline" onClick={() => setFilter('fiado')} className="h-auto bg-card p-4 rounded-xl flex items-center text-left hover:bg-secondary"><Users className="text-yellow-400 mr-4" size={32}/><div ><p className="text-sm text-muted-foreground">Total a Receber</p><p className="text-2xl font-bold text-yellow-400">R$ {totalFiado.toFixed(2)}</p></div></Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Adicionar Nova Despesa (Saída)</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div><Label htmlFor="expense-description">Descrição</Label><Input type="text" id="expense-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Conta de luz" required /></div>
                            <div><Label htmlFor="expense-amount">Valor (R$)</Label><Input type="number" step="0.01" id="expense-amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 150.00" required /></div>
                            <div><Button type="submit" disabled={processing} className="w-full bg-red-600 text-white hover:bg-red-700 disabled:bg-muted-foreground">{processing ? <Spinner size="h-5 w-5"/> : "Adicionar Despesa"}</Button></div>
                        </form>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>{getFilterTitle()}</CardTitle></CardHeader>
                    <CardContent>
                     <div className="overflow-y-auto max-h-64">
                         <Table>
                             <TableBody>
                                {filteredList.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma transação hoje.</TableCell></TableRow> : filteredList.map(item => (
                                    <TableRow key={item.id} className={`${item.balance > 0 ? 'bg-yellow-900/20' : item.type === 'expense' ? 'bg-red-900/20' : 'bg-green-900/20'}`}>
                                        <TableCell>{item.description || item.comandaName || item.name}</TableCell>
                                        <TableCell className="text-right font-bold">{item.balance > 0 ? '' : (item.type === 'expense' ? '-' : '+')} R$ {(item.total || item.balance).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                             </TableBody>
                         </Table>
                     </div>
                    </CardContent>
                </Card>
            </div>
             {isFechamentoModalOpen && <FechamentoCaixaModal open={isFechamentoModalOpen} onOpenChange={setIsFechamentoModalOpen} dailyTransactions={dailyTransactions} />}
        </div>
    );
};
