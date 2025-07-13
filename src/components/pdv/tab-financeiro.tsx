
'use client';
import React, { useState, useMemo } from 'react';
import { getDb, appId } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


import { History, TrendingUp, TrendingDown, Scale, Users } from 'lucide-react';

export const TabFinanceiro = ({ transactions, customers, userId }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const dailyTransactions = useMemo(() => {
        return transactions.filter(t => t.timestamp?.toDate().toISOString().split('T')[0] === date);
    }, [transactions, date]);

    const { totalIncome, totalExpense, totalFiado } = useMemo(() => {
        let income = 0;
        let expense = 0;
        dailyTransactions.forEach(t => {
            if (t.type === 'sale' || t.type === 'payment') income += t.total;
            else if (t.type === 'expense') expense += t.total;
        });
        const fiado = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
        return { totalIncome: income, totalExpense: expense, totalFiado: fiado };
    }, [dailyTransactions, customers]);
    
    const filteredList = useMemo(() => {
        if (filter === 'all') return dailyTransactions;
        if (filter === 'income') return dailyTransactions.filter(t => t.type === 'sale' || t.type === 'payment');
        if (filter === 'expense') return dailyTransactions.filter(t => t.type === 'expense');
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
            setDescription(''); setAmount('');
        } catch (error) {
            console.error("Erro ao adicionar despesa:", error);
        } finally {
            setProcessing(false);
        }
    };

    const getFilterTitle = () => {
        const dateFormatted = new Date(date + 'T03:00:00').toLocaleDateString('pt-BR');
        switch(filter) {
            case 'income': return `Detalhes das Entradas de ${dateFormatted}`;
            case 'expense': return `Detalhes das Saídas de ${dateFormatted}`;
            case 'fiado': return `Clientes com Saldo Devedor`;
            default: return `Todas as Transações de ${dateFormatted}`;
        }
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-foreground flex items-center"><History className="mr-3" /> Financeiro</h2>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary text-foreground p-2 rounded-lg w-48"/>
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
                                {filteredList.map(item => (
                                    <TableRow key={item.id} className={`${item.type === 'expense' ? 'bg-red-900/20' : (item.type ? 'bg-green-900/20' : 'bg-yellow-900/20')}`}>
                                        <TableCell>{item.description || item.comandaName || item.name}</TableCell>
                                        <TableCell className="text-right font-bold">{item.type === 'expense' ? '-' : '+'} R$ {(item.total || item.balance).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                             </TableBody>
                         </Table>
                     </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
