'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Users, UserPlus, History, DollarSign, Edit, Trash2, Search, ChevronRight, X, LayoutGrid, List } from 'lucide-react';
import { Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { CustomerFormModal } from '@/components/customers/customer-form-modal';
import { CustomerPaymentModal } from '@/components/customers/customer-payment-modal';
import { CustomerHistoryModal } from '@/components/customers/customer-history-modal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Gestão de Clientes Mobile-Optimized.
 * CTO: Índice alfabético expansível e visualização híbrida integrados.
 */
export const CustomersTab: React.FC = () => {
    const { customers, transactions, loading, saveCustomer, deleteCustomer, receiveCustomerPayment } = useData();
    const { toast } = useToast();

    const [modalState, setModalState] = useState({ form: false, payment: false, history: false, delete: false });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'debtors'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'list'>('list'); // Only list mode for consistent mobile experience
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const activeLetters = useMemo(() => {
        const initials = new Set(customers.map(c => c.name.charAt(0).toUpperCase()));
        return alphabet.filter(l => initials.has(l)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [customers, alphabet]);

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => {
                const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesFilter = filterType === 'debtors' ? (c.balance || 0) > 0 : true;
                const matchesLetter = !selectedLetter || c.name.charAt(0).toUpperCase() === selectedLetter;
                return matchesSearch && matchesFilter && matchesLetter;
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [customers, searchTerm, filterType, selectedLetter]);

    const closeAllModals = useCallback(() => {
        setModalState({ form: false, payment: false, history: false, delete: false });
        setSelectedCustomer(null);
    }, []);

    const handleEdit = (customer: Customer) => { setSelectedCustomer(customer); setModalState(prev => ({ ...prev, form: true })); };
    const handlePayment = (customer: Customer) => { setSelectedCustomer(customer); setModalState(prev => ({ ...prev, payment: true })); };
    const handleHistory = (customer: Customer) => { setSelectedCustomer(customer); setModalState(prev => ({ ...prev, history: true })); };
    const handleDeleteClick = (customer: Customer) => {
        if (customer.balance && customer.balance > 0) {
            toast({ title: "Bloqueado", description: "Não excluímos devedores.", variant: "destructive" });
            return;
        }
        setSelectedCustomer(customer);
        setModalState(prev => ({ ...prev, delete: true }));
    };

    const confirmDelete = async () => {
        if (selectedCustomer?.id) { await deleteCustomer(selectedCustomer.id); closeAllModals(); }
    };

    const renderListView = () => (
        <Accordion type="multiple" className="space-y-3 pb-20 pr-1">
            {activeLetters.map(letter => {
                const customersInLetter = filteredCustomers.filter(c => c.name.charAt(0).toUpperCase() === letter);
                if (customersInLetter.length === 0) return null;

                return (
                    <AccordionItem key={letter} value={letter} className="bg-card border rounded-2xl overflow-hidden shadow-sm px-0 border-b-0">
                        <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 h-16">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <span className="font-black text-xs">{letter}</span>
                                </div>
                                <span className="font-black uppercase text-xs tracking-widest">{letter} - Índice</span>
                                <Badge variant="secondary" className="ml-2 text-[9px] font-bold">{customersInLetter.length}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t">
                            <div className="flex flex-col gap-1 p-2">
                                {customersInLetter.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-4 bg-background/40 rounded-xl hover:bg-muted/20 transition-colors active:scale-[0.98]">
                                        <div className="flex items-center gap-4 min-w-0 pr-2">
                                            <div className="p-2 rounded-lg bg-slate-900 text-slate-400 shrink-0">
                                                <Users size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate uppercase tracking-tight">{c.name}</p>
                                                <p className={cn("text-[9px] font-black uppercase tracking-widest", (c.balance || 0) > 0 ? "text-yellow-500" : "text-emerald-500")}>
                                                    R$ {(c.balance || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="h-9 w-9"><History size={18} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="h-9 w-9 text-accent" disabled={!c.balance || c.balance <= 0}><DollarSign size={18} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-9 w-9 text-primary"><Edit size={18} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="h-9 w-9 text-destructive" disabled={(c.balance || 0) > 0}><Trash2 size={18} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-3 w-full md:max-w-2xl">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Filtrar fiéis..." 
                                className="pl-11 h-12 bg-background border-none shadow-inner rounded-xl text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <Button onClick={() => setModalState(p => ({...p, form: true}))} className="w-full md:w-auto font-black gap-2 h-12 uppercase text-xs tracking-widest shadow-lg" disabled={loading}>
                        <UserPlus className="h-5 w-5" />
                        Novo Cliente
                    </Button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Spinner size="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sincronizando Fiéis...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {(selectedLetter || searchTerm) && (
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedLetter(null); setSearchTerm(''); }} className="text-[9px] font-black uppercase text-primary gap-1 h-7 px-3 bg-primary/5 rounded-full">
                                        <X size={12} /> Limpar
                                    </Button>
                                )}
                                {selectedLetter && <Badge className="text-[8px] font-black uppercase tracking-widest bg-primary text-white h-7 px-3 rounded-full">{selectedLetter}</Badge>}
                            </div>
                            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg h-9">
                                <Button variant={filterType === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('all')} className="text-[9px] font-black px-3 h-7 uppercase">Todos</Button>
                                <Button variant={filterType === 'debtors' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('debtors')} className={cn("text-[9px] font-black px-3 h-7 uppercase", filterType === 'debtors' && "text-yellow-400")}>Dívidas</Button>
                            </div>
                        </div>

                        {renderListView()}
                    </>
                )}

                {modalState.form && <CustomerFormModal customer={selectedCustomer} open={modalState.form} onOpenChange={closeAllModals} onSave={saveCustomer} />}
                {modalState.payment && selectedCustomer && <CustomerPaymentModal customerForPayment={selectedCustomer} open={modalState.payment} onOpenChange={closeAllModals} onReceivePayment={receiveCustomerPayment} />}
                {modalState.history && selectedCustomer && <CustomerHistoryModal customer={selectedCustomer} transactions={transactions} open={modalState.history} onOpenChange={closeAllModals} />}
                
                {selectedCustomer && modalState.delete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent className="rounded-3xl p-8 border-border/40">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive uppercase font-black tracking-tight text-lg">Excluir Fiel?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed mt-2">Apagar perfil de &quot;{selectedCustomer.name}&quot;?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-6">
                                <AlertDialogCancel className="h-12 font-black uppercase text-[10px] rounded-xl">Não</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90 font-black uppercase text-[10px] h-12 rounded-xl">Sim, Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};
