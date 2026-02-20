'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Users, UserPlus, History, DollarSign, Edit, Trash2, Search, AlertCircle, ChevronRight, X, LayoutGrid, List } from 'lucide-react';
import { Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { CustomerFormModal } from '@/components/customers/customer-form-modal';
import { CustomerPaymentModal } from '@/components/customers/customer-payment-modal';
import { CustomerHistoryModal } from '@/components/customers/customer-history-modal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Gestão de Clientes com Navegação Alfabética por Acordeão (Premium).
 * CTO: Implementação do modo drill-down tático para agilidade no balcão.
 */
export const CustomersTab: React.FC = () => {
    const { customers, transactions, loading, saveCustomer, deleteCustomer, receiveCustomerPayment } = useData();
    const { toast } = useToast();

    const [modalState, setModalState] = useState({ form: false, payment: false, history: false, delete: false });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'debtors'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const activeLetters = useMemo(() => {
        const initials = new Set(customers.map(c => c.name.charAt(0).toUpperCase()));
        return Array.from(initials);
    }, [customers]);

    const stats = useMemo(() => {
        const debtors = customers.filter(c => (c.balance || 0) > 0);
        const totalDebt = debtors.reduce((sum, c) => sum + (c.balance || 0), 0);
        return {
            count: debtors.length,
            total: totalDebt
        };
    }, [customers]);

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
        if (selectedCustomer?.id) { 
            await deleteCustomer(selectedCustomer.id);
            closeAllModals();
        }
    };

    const renderCustomerTable = (customerList: Customer[]) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead className="font-bold">Nome</TableHead>
                        <TableHead className="font-bold">Saldo Devedor</TableHead>
                        <TableHead className="text-right font-bold">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customerList.map(c => (
                        <TableRow key={c.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-bold text-sm">{c.name}</TableCell>
                            <TableCell className={cn("font-black", (c.balance || 0) > 0 ? 'text-yellow-400' : 'text-accent')}>
                                R$ {(Number(c.balance) || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="h-8 w-8"><History size={16} /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="h-8 w-8 text-accent" disabled={!c.balance || c.balance <= 0}><DollarSign size={16} /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-8 w-8 text-primary"><Edit size={16} /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="h-8 w-8 text-destructive" disabled={(c.balance || 0) > 0}><Trash2 size={16} /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const renderAlphaAccordion = () => (
        <Accordion type="multiple" className="space-y-3 pb-20">
            {alphabet.map(letter => {
                const isActive = activeLetters.includes(letter);
                const customersForLetter = customers
                    .filter(c => c.name.charAt(0).toUpperCase() === letter)
                    .filter(c => filterType === 'debtors' ? (c.balance || 0) > 0 : true)
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

                if (customersForLetter.length === 0) return null;

                return (
                    <AccordionItem 
                        key={letter} 
                        value={letter} 
                        className="bg-card rounded-xl border-none shadow-sm overflow-hidden"
                    >
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all border-l-4 border-l-primary">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl bg-primary/10 text-primary">
                                    {letter}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-base">Letra {letter}</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                        {customersForLetter.length} fiéis encontrados
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t border-border/20">
                            {renderCustomerTable(customersForLetter)}
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground flex items-center">
                            <Users className="mr-3 text-primary" /> Clientes
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Gestão de Fiéis e Fiado</p>
                    </div>
                    <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-black uppercase tracking-tight hover:bg-primary/80 w-full md:w-auto h-12 shadow-lg">
                        <UserPlus className="mr-2" size={20} /> Novo Cliente
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border-l-4 border-l-yellow-400 p-4 rounded-xl shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Total a Receber</p>
                        <p className="text-2xl font-black text-yellow-400">R$ {stats.total.toFixed(2)}</p>
                    </div>
                    <div className="bg-card border-l-4 border-l-primary p-4 rounded-xl shadow-sm flex flex-col justify-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Devedores</p>
                        <p className="text-2xl font-black text-primary">{stats.count} Pessoas</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome ou telefone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-card border-2 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg shrink-0">
                        <Button 
                            variant={filterType === 'all' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setFilterType('all')}
                            className="text-[10px] uppercase font-bold h-9 px-4"
                        >
                            Todos
                        </Button>
                        <Button 
                            variant={filterType === 'debtors' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setFilterType('debtors')}
                            className={cn("text-[10px] uppercase font-bold h-9 px-4", filterType === 'debtors' && "text-yellow-400")}
                        >
                            Devedores
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Spinner size="h-12 w-12" />
                        <p className="text-sm text-muted-foreground mt-4 font-bold uppercase tracking-widest animate-pulse">Sincronizando Lista...</p>
                    </div>
                ) : (
                    searchTerm ? (
                        <div className="bg-card rounded-xl border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            {renderCustomerTable(customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())))}
                        </div>
                    ) : renderAlphaAccordion()
                )}

                {modalState.form && <CustomerFormModal customer={selectedCustomer} open={modalState.form} onOpenChange={closeAllModals} onSave={saveCustomer} />}
                {modalState.payment && selectedCustomer && <CustomerPaymentModal customerForPayment={selectedCustomer} open={modalState.payment} onOpenChange={closeAllModals} onReceivePayment={receiveCustomerPayment} />}
                {modalState.history && selectedCustomer && <CustomerHistoryModal customer={selectedCustomer} transactions={transactions} open={modalState.history} onOpenChange={closeAllModals} />}
                
                {selectedCustomer && modalState.delete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive"><Trash2 size={20}/> Excluir Fiel?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação excluirá permanentemente o registro de &quot;{selectedCustomer.name}&quot;.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={closeAllModals}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80 text-white font-bold">
                                    Sim, excluir registro
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'warning' | 'outline' | 'default', className?: string }) => (
    <span className={cn(
        "px-2 py-0.5 rounded-full font-black tracking-tighter flex items-center justify-center text-[10px]",
        variant === 'warning' ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : 
        variant === 'default' ? "bg-primary text-white" :
        "bg-muted text-muted-foreground border border-border",
        className
    )}>
        {children}
    </span>
);
