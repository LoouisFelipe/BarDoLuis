
'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { Users, UserPlus, History, DollarSign, Edit, Trash2, Search, ChevronRight, X, LayoutGrid, List } from 'lucide-react';
import { Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { CustomerFormModal } from '@/components/customers/customer-form-modal';
import { CustomerPaymentModal } from '@/components/customers/customer-payment-modal';
import { CustomerHistoryModal } from '@/components/customers/customer-history-modal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Gestão de Clientes com Navegação por Acordeão Alfabético.
 * CTO: Implementação de Índice A-Z integrado com modo Lista Premium.
 */
export const CustomersTab: React.FC = () => {
    const { customers, transactions, loading, saveCustomer, deleteCustomer, receiveCustomerPayment } = useData();
    const { toast } = useToast();

    const [modalState, setModalState] = useState({ form: false, payment: false, history: false, delete: false });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'debtors'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const activeLetters = useMemo(() => {
        const initials = new Set(customers.map(c => c.name.charAt(0).toUpperCase()));
        return alphabet.filter(l => initials.has(l));
    }, [customers]);

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
            toast({ title: "Bloqueado", description: "Não é possível excluir clientes com dívida.", variant: "destructive" });
            return;
        }
        setSelectedCustomer(customer);
        setModalState(prev => ({ ...prev, delete: true }));
    };

    const confirmDelete = async () => {
        if (selectedCustomer?.id) { await deleteCustomer(selectedCustomer.id); closeAllModals(); }
    };

    const renderIndexGrid = () => (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-20">
            {alphabet.map(letter => {
                const isActive = activeLetters.includes(letter);
                const count = customers.filter(c => c.name.charAt(0).toUpperCase() === letter).length;
                
                return (
                    <Card 
                        key={letter} 
                        className={cn(
                            "aspect-square flex flex-col items-center justify-center cursor-pointer transition-all border-2",
                            isActive ? "hover:border-primary bg-card" : "opacity-20 pointer-events-none bg-muted"
                        )}
                        onClick={() => setSelectedLetter(letter)}
                    >
                        <span className="text-2xl font-black text-primary">{letter}</span>
                        {isActive && <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{count} fiéis</span>}
                    </Card>
                );
            })}
        </div>
    );

    const renderListView = () => (
        <Accordion type="multiple" className="space-y-2 pb-20">
            {activeLetters.map(letter => {
                const customersInLetter = filteredCustomers.filter(c => c.name.charAt(0).toUpperCase() === letter);
                if (customersInLetter.length === 0) return null;

                return (
                    <AccordionItem key={letter} value={letter} className="bg-card border rounded-xl overflow-hidden shadow-sm px-0">
                        <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <span className="font-black text-sm">{letter}</span>
                                </div>
                                <span className="font-black uppercase text-xs tracking-widest">Inicial {letter}</span>
                                <Badge variant="secondary" className="ml-2 text-[9px] font-bold">{customersInLetter.length} Fiéis</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t">
                            <div className="flex flex-col">
                                {customersInLetter.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-slate-900 text-slate-400">
                                                <Users size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm uppercase tracking-tight">{c.name}</p>
                                                <p className={cn("text-[9px] font-black uppercase tracking-widest", (c.balance || 0) > 0 ? "text-yellow-500" : "text-emerald-500")}>
                                                    Saldo: R$ {(c.balance || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="h-8 w-8 text-slate-400 hover:text-white"><History size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="h-8 w-8 text-accent hover:bg-accent/10" disabled={!c.balance || c.balance <= 0}><DollarSign size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-8 w-8 text-primary hover:bg-primary/10"><Edit size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={(c.balance || 0) > 0}><Trash2 size={16} /></Button>
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
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-4 w-full md:max-w-2xl">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar fiel pelo nome..." 
                                className="pl-10 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg shrink-0">
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('grid')}
                                className="h-9 w-9"
                            >
                                <LayoutGrid size={18} />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('list')}
                                className="h-9 w-9"
                            >
                                <List size={18} />
                            </Button>
                        </div>
                    </div>
                    <Button onClick={() => setModalState(p => ({...p, form: true}))} className="w-full md:w-auto font-bold gap-2 h-11" disabled={loading}>
                        <UserPlus className="h-5 w-5" />
                        Novo Cliente
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Spinner size="h-12 w-12" /></div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {(selectedLetter || searchTerm) && (
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedLetter(null); setSearchTerm(''); }} className="text-[10px] font-black uppercase text-primary gap-1">
                                        <X size={12} /> Voltar para o Índice
                                    </Button>
                                )}
                                {selectedLetter && <Badge variant="default" className="font-black uppercase tracking-widest text-[10px] bg-primary h-7 text-white">{selectedLetter}</Badge>}
                            </div>
                            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                                <Button variant={filterType === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('all')} className="text-[10px] font-bold px-3 h-7">Todos</Button>
                                <Button variant={filterType === 'debtors' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('debtors')} className={cn("text-[10px] font-bold px-3 h-7", filterType === 'debtors' && "text-yellow-400")}>Devedores</Button>
                            </div>
                        </div>

                        {searchTerm ? (
                            <div className="space-y-2 pb-20">
                                {filteredCustomers.map(c => (
                                    <Card key={c.id} className="bg-card hover:bg-muted/50 transition-all">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Users size={20} /></div>
                                                <div><p className="font-bold text-base">{c.name}</p><p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Saldo: R$ {(c.balance || 0).toFixed(2)}</p></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="h-9 w-9"><History size={18} /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="h-9 w-9 text-accent" disabled={!c.balance || c.balance <= 0}><DollarSign size={18} /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-9 w-9 text-primary"><Edit size={18} /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="h-9 w-9 text-destructive" disabled={(c.balance || 0) > 0}><Trash2 size={18} /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : viewMode === 'grid' && !selectedLetter ? (
                            renderIndexGrid()
                        ) : (
                            renderListView()
                        )}
                    </>
                )}

                {modalState.form && <CustomerFormModal customer={selectedCustomer} open={modalState.form} onOpenChange={closeAllModals} onSave={saveCustomer} />}
                {modalState.payment && selectedCustomer && <CustomerPaymentModal customerForPayment={selectedCustomer} open={modalState.payment} onOpenChange={closeAllModals} onReceivePayment={receiveCustomerPayment} />}
                {modalState.history && selectedCustomer && <CustomerHistoryModal customer={selectedCustomer} transactions={transactions} open={modalState.history} onOpenChange={closeAllModals} />}
                
                {selectedCustomer && modalState.delete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive uppercase font-black">Excluir Fiel?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase">Essa ação é irreversível.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90 font-black">Confirmar Exclusão</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};

const BadgeLocal = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'warning' | 'outline' | 'default', className?: string }) => (
    <span className={cn(
        "px-2 py-0.5 rounded-full font-black tracking-tighter flex items-center justify-center text-[10px]",
        variant === 'warning' ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : 
        variant === 'outline' ? "bg-muted text-muted-foreground border border-border" :
        "bg-primary text-white",
        className
    )}>
        {children}
    </span>
);
