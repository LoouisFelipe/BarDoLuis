'use client';
import React, { useState, useCallback } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Users, UserPlus, History, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { CustomerFormModal } from '@/components/customers/customer-form-modal';
import { CustomerPaymentModal } from '@/components/customers/customer-payment-modal';
import { CustomerHistoryModal } from '@/components/customers/customer-history-modal';
import { useToast } from '@/hooks/use-toast';

export const CustomersTab: React.FC = () => {
    const { customers, transactions, loading, saveCustomer, deleteCustomer, receiveCustomerPayment } = useData();
    const { toast } = useToast();

    const [modalState, setModalState] = useState({ form: false, payment: false, history: false, delete: false });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const closeAllModals = useCallback(() => {
        setModalState({ form: false, payment: false, history: false, delete: false });
        setSelectedCustomer(null);
    }, []);

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setModalState(prev => ({ ...prev, form: true }));
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setModalState(prev => ({ ...prev, form: true }));
    };

    const handlePayment = (customer: Customer) => {
        setSelectedCustomer(customer);
        setModalState(prev => ({ ...prev, payment: true }));
    };

    const handleHistory = (customer: Customer) => {
        setSelectedCustomer(customer);
        setModalState(prev => ({ ...prev, history: true }));
    };

    const handleDeleteClick = (customer: Customer) => {
        if (customer.balance && customer.balance > 0) {
            toast({
                title: "Ação Bloqueada",
                description: "Não é possível excluir clientes com saldo devedor.",
                variant: "destructive"
            });
            return;
        }
        setSelectedCustomer(customer);
        setModalState(prev => ({ ...prev, delete: true }));
    };

    const confirmDelete = async () => {
        // CTO Rule: Ensure ID exists before calling deleteCustomer.
        if (selectedCustomer?.id) { 
            await deleteCustomer(selectedCustomer.id);
            closeAllModals();
        }
    };

    const renderDesktopView = () => (
        <div className="bg-card rounded-xl shadow-lg overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Saldo Devedor</TableHead>
                            <TableHead>Limite de Crédito</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{c.contact}</TableCell>
                                <TableCell className={`font-bold ${c.balance && c.balance > 0 ? 'text-yellow-400' : 'text-accent'}`}>R$ {(Number(c.balance) || 0).toFixed(2)}</TableCell>
                                <TableCell>
                                    {typeof c.creditLimit === 'number'
                                        ? `R$ ${c.creditLimit.toFixed(2)}`
                                        : <span className="text-muted-foreground">N/A</span>
                                    }
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end space-x-1">
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="text-muted-foreground hover:text-foreground"><History size={20} /></Button></TooltipTrigger><TooltipContent><p>Histórico de Compras</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="text-accent hover:text-accent/80" disabled={!c.balance || c.balance <= 0}><DollarSign size={20} /></Button></TooltipTrigger><TooltipContent><p>Receber Pagamento</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-primary hover:text-primary/80"><Edit size={20} /></Button></TooltipTrigger><TooltipContent><p>Editar Cliente</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="text-destructive hover:text-destructive/80" disabled={(c.balance || 0) > 0}><Trash2 size={20} /></Button></TooltipTrigger><TooltipContent><p>Excluir Cliente</p></TooltipContent></Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
    
    const renderMobileView = () => (
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {customers.map(c => (
                <Card key={c.id} className="bg-card shadow-lg">
                    <CardHeader>
                        <CardTitle>{c.name}</CardTitle>
                        <CardDescription>{c.contact}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                            <p className={`text-lg font-bold ${c.balance && c.balance > 0 ? 'text-yellow-400' : 'text-accent'}`}>
                                R$ {(Number(c.balance) || 0).toFixed(2)}
                            </p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Limite de Crédito</p>
                            <p className="text-base font-semibold">
                                {typeof c.creditLimit === 'number'
                                    ? `R$ ${c.creditLimit.toFixed(2)}`
                                    : <span className="text-muted-foreground">N/A</span>
                                }
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2">
                         <Button variant="outline" size="sm" onClick={() => handleHistory(c)}><History size={16} className="mr-2"/> Histórico</Button>
                         <Button variant="outline" size="sm" onClick={() => handlePayment(c)} disabled={!c.balance || c.balance <= 0} className="text-accent border-accent hover:bg-accent/10 hover:text-accent/80"><DollarSign size={16} className="mr-2"/> Pagar</Button>
                         <Button variant="outline" size="sm" onClick={() => handleEdit(c)} className="text-primary border-primary hover:bg-primary/10 hover:text-primary/80"><Edit size={16} className="mr-2"/> Editar</Button>
                         <Button variant="outline" size="sm" onClick={() => handleDeleteClick(c)} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive/80" disabled={(c.balance || 0) > 0}><Trash2 size={16} className="mr-2"/> Excluir</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    return (
        <>
            <div className="p-1 md:p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-3xl font-bold text-foreground flex items-center"><Users className="mr-3" /> Gerenciar Clientes</h2>
                    <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80 w-full md:w-auto">
                        <UserPlus className="mr-2" size={20} /> Novo Cliente
                    </Button>
                </div>
                {loading ? <div className="flex justify-center"><Spinner /></div> : (
                     customers.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 mt-10 bg-card rounded-lg">
                            <Users size={48} className="mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground">Nenhum Cliente Cadastrado</h3>
                            <p className="max-w-sm mx-auto mt-2">Adicione clientes para gerenciar vendas a prazo e ver históricos.</p>
                        </div>
                    ) : (
                        <TooltipProvider>
                            {renderDesktopView()}
                            {renderMobileView()}
                        </TooltipProvider>
                    )
                )}
                {modalState.form && <CustomerFormModal customer={selectedCustomer} open={modalState.form} onOpenChange={closeAllModals} onSave={saveCustomer} />}
                {modalState.payment && selectedCustomer && <CustomerPaymentModal customerForPayment={selectedCustomer} open={modalState.payment} onOpenChange={closeAllModals} onReceivePayment={receiveCustomerPayment} />}
                {modalState.history && selectedCustomer && <CustomerHistoryModal customer={selectedCustomer} transactions={transactions} open={modalState.history} onOpenChange={closeAllModals} />}
                 {selectedCustomer && modalState.delete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente <strong>{selectedCustomer.name}</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={closeAllModals}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80">
                                    Sim, excluir cliente
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </>
    );
};
