'use client';
import React, { useState } from 'react';

import { CustomerFormModal } from './modals/customer-form-modal';
import { CustomerPaymentModal } from './modals/customer-payment-modal';
import { CustomerAnalysisModal } from './modals/customer-analysis-modal';
import { CustomerHistoryModal } from './modals/customer-history-modal';
import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Users, UserPlus, History, Sparkles, DollarSign, Edit } from 'lucide-react';

export const TabClientes = ({ customers, loading, userId, transactions, showNotification }) => { 
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [customerForPayment, setCustomerForPayment] = useState(null);
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [customerForAnalysis, setCustomerForAnalysis] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [customerForHistory, setCustomerForHistory] = useState(null);

    const handleEdit = (customer) => { setEditingCustomer(customer); setModalOpen(true); };
    const handleAddNew = () => { setEditingCustomer(null); setModalOpen(true); };
    const handlePayment = (customer) => { setCustomerForPayment(customer); setPaymentModalOpen(true); };
    const handleAnalysis = (customer) => { setCustomerForAnalysis(customer); setAnalysisModalOpen(true); };
    const handleHistory = (customer) => { setCustomerForHistory(customer); setIsHistoryModalOpen(true); };

    return (
        <TooltipProvider>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-foreground flex items-center"><Users className="mr-3" /> Gerenciar Clientes</h2>
                    <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80">
                        <UserPlus className="mr-2" size={20} /> Novo Cliente
                    </Button>
                </div>
                {loading ? <div className="flex justify-center"><Spinner /></div> : (
                    <div className="bg-card rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Celular</TableHead>
                                        <TableHead>Saldo Devedor</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell>{c.phone}</TableCell>
                                            <TableCell className={`font-bold ${c.balance > 0 ? 'text-destructive' : 'text-green-400'}`}>R$ {(Number(c.balance) || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="text-muted-foreground hover:text-foreground"><History size={20} /></Button></TooltipTrigger><TooltipContent><p>Histórico de Compras</p></TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleAnalysis(c)} className="text-purple-400 hover:text-purple-300"><Sparkles size={20} /></Button></TooltipTrigger><TooltipContent><p>Analisar Perfil com IA</p></TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="text-green-400 hover:text-green-300" disabled={!c.balance || c.balance <= 0}><DollarSign size={20} /></Button></TooltipTrigger><TooltipContent><p>Receber Pagamento</p></TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-blue-400 hover:text-blue-300"><Edit size={20} /></Button></TooltipTrigger><TooltipContent><p>Editar Cliente</p></TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
                {isModalOpen && <CustomerFormModal customer={editingCustomer} open={isModalOpen} onOpenChange={setModalOpen} userId={userId} showNotification={showNotification} />}
                {isPaymentModalOpen && <CustomerPaymentModal customerForPayment={customerForPayment} open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen} userId={userId} showNotification={showNotification} />}
                {isAnalysisModalOpen && <CustomerAnalysisModal customer={customerForAnalysis} transactions={transactions} open={isAnalysisModalOpen} onOpenChange={setAnalysisModalOpen} />}
                {isHistoryModalOpen && <CustomerHistoryModal customer={customerForHistory} transactions={transactions} open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen} />}
            </div>
        </TooltipProvider>
    );
};
