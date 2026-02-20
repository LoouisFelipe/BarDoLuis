'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
 * @fileOverview Gestão de Clientes com Navegação Alfabética por Acordeão (UX Premium).
 * CTO: Implementação do modo drill-down com setas expansíveis para maior agilidade.
 */
export const CustomersTab: React.FC = () => {
    const { customers, transactions, loading, saveCustomer, deleteCustomer, receiveCustomerPayment } = useData();
    const { toast } = useToast();

    const [modalState, setModalState] = useState({ form: false, payment: false, history: false, delete: false });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'debtors'>('all');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
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

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => {
                const nameMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (c.contact && c.contact.toLowerCase().includes(searchTerm.toLowerCase()));
                const letterMatch = !selectedLetter || c.name.startsWith(selectedLetter) || c.name.startsWith(selectedLetter.toLowerCase());
                const statusMatch = filterType === 'debtors' ? (c.balance || 0) > 0 : true;
                
                if (searchTerm) return nameMatch && statusMatch;
                return letterMatch && statusMatch;
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [customers, searchTerm, filterType, selectedLetter]);

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
                        <TableHead className="font-bold">Contato</TableHead>
                        <TableHead className="font-bold">Saldo Devedor</TableHead>
                        <TableHead className="font-bold">Limite</TableHead>
                        <TableHead className="text-right font-bold">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customerList.map(c => (
                        <TableRow key={c.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-muted-foreground">{c.contact || '—'}</TableCell>
                            <TableCell className={cn("font-black", (c.balance || 0) > 0 ? 'text-yellow-400' : 'text-accent')}>
                                R$ {(Number(c.balance) || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs">
                                {typeof c.creditLimit === 'number'
                                    ? `R$ ${c.creditLimit.toFixed(2)}`
                                    : <span className="text-muted-foreground opacity-50">N/A</span>
                                }
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end space-x-1">
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleHistory(c)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><History size={18} /></Button></TooltipTrigger><TooltipContent><p>Extrato</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handlePayment(c)} className="h-8 w-8 text-accent hover:bg-accent/10" disabled={!c.balance || c.balance <= 0}><DollarSign size={18} /></Button></TooltipTrigger><TooltipContent><p>Receber</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-8 w-8 text-primary hover:bg-primary/10"><Edit size={18} /></Button></TooltipTrigger><TooltipContent><p>Editar</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)} className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={(c.balance || 0) > 0}><Trash2 size={18} /></Button></TooltipTrigger><TooltipContent><p>Excluir</p></TooltipContent></Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
    
    const renderCardView = (customerList: Customer[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerList.map(c => (
                <Card key={c.id} className="bg-card shadow-md border-2 border-transparent hover:border-primary/20 transition-all overflow-hidden group">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base truncate max-w-[150px]">{c.name}</CardTitle>
                                <CardDescription className="text-[10px] uppercase font-bold">{c.contact || 'Sem contato'}</CardDescription>
                            </div>
                            <Badge variant={(c.balance || 0) > 0 ? "warning" : "default"} className="text-[10px]">
                                {(c.balance || 0) > 0 ? "DÉBITO" : "EM DIA"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex justify-between items-baseline">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Saldo Devedor</p>
                            <p className={cn("text-lg font-black", (c.balance || 0) > 0 ? 'text-yellow-400' : 'text-accent')}>
                                R$ {(Number(c.balance) || 0).toFixed(2)}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 bg-muted/20 grid grid-cols-4 gap-1">
                         <Button variant="ghost" size="sm" onClick={() => handleHistory(c)} className="h-10 flex flex-col items-center gap-0.5"><History size={16}/><span className="text-[8px] uppercase font-bold">Extrato</span></Button>
                         <Button variant="ghost" size="sm" onClick={() => handlePayment(c)} disabled={!c.balance || c.balance <= 0} className="h-10 text-accent flex flex-col items-center gap-0.5"><DollarSign size={16}/><span className="text-[8px] uppercase font-bold">Pagar</span></Button>
                         <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="h-10 text-primary flex flex-col items-center gap-0.5"><Edit size={16}/><span className="text-[8px] uppercase font-bold">Editar</span></Button>
                         <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(c)} className="h-10 text-destructive flex flex-col items-center gap-0.5" disabled={(c.balance || 0) > 0}><Trash2 size={16}/><span className="text-[8px] uppercase font-bold">Excluir</span></Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    const renderAlphaGrid = () => (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-20">
            {alphabet.map(letter => {
                const isActive = activeLetters.includes(letter);
                return (
                    <Card 
                        key={letter} 
                        className={cn(
                            "aspect-square flex flex-col items-center justify-center cursor-pointer transition-all border-2 shadow-sm relative group overflow-hidden",
                            isActive 
                                ? "bg-card/40 hover:border-primary hover:bg-primary/5" 
                                : "opacity-30 grayscale cursor-not-allowed border-dashed"
                        )}
                        onClick={() => isActive && setSelectedLetter(letter)}
                    >
                        <span className={cn("text-3xl font-black transition-transform", isActive && "group-hover:scale-110")}>{letter}</span>
                        {isActive && <ChevronRight className="absolute right-1 bottom-1 h-3 w-3 text-primary/40 group-hover:text-primary transition-colors" />}
                    </Card>
                );
            })}
        </div>
    );

    const renderAlphaAccordionList = () => (
        <Accordion type="multiple" className="space-y-3 pb-20">
            {alphabet.map(letter => {
                const isActive = activeLetters.includes(letter);
                const customersForLetter = customers
                    .filter(c => c.name.charAt(0).toUpperCase() === letter)
                    .filter(c => filterType === 'debtors' ? (c.balance || 0) > 0 : true)
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

                if (customersForLetter.length === 0 && !isActive) return null;
                if (customersForLetter.length === 0 && isActive && filterType === 'debtors') return null;

                return (
                    <AccordionItem 
                        key={letter} 
                        value={letter} 
                        className={cn(
                            "bg-card rounded-xl border-none shadow-sm overflow-hidden",
                            !isActive && "opacity-30 grayscale pointer-events-none"
                        )}
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
                        <AccordionContent className="p-0 border-t">
                            {renderCustomerTable(customersForLetter)}
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );

    return (
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
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Total a Receber (Fiado)</p>
                    <p className="text-2xl font-black text-yellow-400">R$ {stats.total.toFixed(2)}</p>
                </div>
                <div className="bg-card border-l-4 border-l-primary p-4 rounded-xl shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Clientes com Débito</p>
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
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg shrink-0">
                    <Button 
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        onClick={() => setViewMode('list')}
                        className="h-9 w-9"
                    >
                        <List size={18} />
                    </Button>
                    <Button 
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        onClick={() => setViewMode('grid')}
                        className="h-9 w-9"
                    >
                        <LayoutGrid size={18} />
                    </Button>
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
                (!selectedLetter && !searchTerm) ? (
                    viewMode === 'list' ? renderAlphaAccordionList() : renderAlphaGrid()
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between bg-muted/20 p-2 rounded-lg border">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedLetter(null); setSearchTerm(''); }}
                                className="text-[10px] font-black uppercase text-primary gap-1"
                            >
                                <X size={12} /> Voltar para o Índice
                            </Button>
                            {selectedLetter && <Badge variant="default" className="font-black uppercase tracking-widest text-[10px] bg-primary h-7 px-4">{selectedLetter}</Badge>}
                        </div>

                        {filteredCustomers.length === 0 ? (
                            <div className="text-center text-muted-foreground p-12 mt-4 bg-muted/10 rounded-xl border-2 border-dashed flex flex-col items-center gap-4">
                                <AlertCircle size={48} className="opacity-20" />
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Nenhum fiel encontrado</h3>
                                    <p className="text-sm">Tente ajustar sua busca ou filtro.</p>
                                </div>
                                {searchTerm && <Button variant="link" onClick={() => setSearchTerm('')}>Limpar Busca</Button>}
                            </div>
                        ) : (
                            <TooltipProvider>
                                {viewMode === 'list' ? renderCustomerTable(filteredCustomers) : renderCardView(filteredCustomers)}
                            </TooltipProvider>
                        )}
                    </div>
                )
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
                                Essa ação excluirá permanentemente o registro de <strong>{selectedCustomer.name}</strong>. Certifique-se de que não há débitos pendentes.
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
    );
};

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'warning' | 'outline' | 'default', className?: string }) => (
    <span className={cn(
        "px-2 py-0.5 rounded-full font-black tracking-tighter flex items-center justify-center",
        variant === 'warning' ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : 
        variant === 'default' ? "bg-primary text-white" :
        "bg-muted text-muted-foreground border border-border",
        className
    )}>
        {children}
    </span>
);
