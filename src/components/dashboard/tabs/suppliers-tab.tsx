
'use client';
import React, { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
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
import { Truck, PlusCircle, ShoppingCart, FileText, Edit, Trash2, LayoutGrid, List } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { Supplier } from '@/lib/schemas';
import { SupplierFormModal } from '@/components/suppliers/supplier-form-modal';
import { PurchaseModal } from '@/components/suppliers/purchase-modal';
import { PurchaseHistoryModal } from '@/components/suppliers/purchase-history-modal';

/**
 * @fileOverview Aba de Fornecedores.
 * CTO: Saneamento de build e correção de sintaxe no seletor de visualização.
 */
export const SuppliersTab: React.FC = () => {
    const { suppliers, products, loading, saveSupplier, deleteSupplier, recordPurchaseAndUpdateStock, saveProduct } = useData();
    const [modalState, setModalState] = useState({ form: false, purchase: false, history: false, delete: false });
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const closeAllModals = () => { 
        setModalState({ form: false, purchase: false, history: false, delete: false }); 
        setSelectedSupplier(null); 
    };
    
    const handleOpenModal = (modal: keyof typeof modalState, supplier?: Supplier) => { 
        setSelectedSupplier(supplier || null); 
        setModalState(prev => ({ ...prev, [modal]: true })); 
    };
    
    if (loading) return <div className="flex justify-center py-20"><Spinner size="h-12 w-12" /></div>;

    const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Fornecedores</h2>
                            <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mt-1">Parceiros de Reposição</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl shrink-0">
                            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-9 w-9 rounded-lg">
                                <List size={18} />
                            </Button>
                            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-9 w-9 rounded-lg">
                                <LayoutGrid size={18} />
                            </Button>
                        </div>
                        <Button onClick={() => handleOpenModal('form')} className="bg-primary text-primary-foreground font-black hover:bg-primary/80 h-11 uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2">
                            <PlusCircle size={18} /> Novo Fornecedor
                        </Button>
                    </div>
                </div>
                
                {viewMode === 'list' ? (
                    <Accordion type="multiple" className="space-y-4" defaultValue={sortedSuppliers.map(s => s.id!)}>
                        {sortedSuppliers.map(s => (
                            <AccordionItem key={s.id} value={s.id!} className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden border-b-0">
                                <AccordionTrigger className="px-6 text-base font-black uppercase tracking-tight hover:no-underline group h-16">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                                            <Truck size={18} />
                                        </div>
                                        <span>{s.name}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 border-t border-border/10">
                                   <div className="flex flex-col gap-6 pt-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {s.contactPerson && (
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground">Contato</p>
                                                    <p className="text-sm font-bold">{s.contactPerson}</p>
                                                </div>
                                            )}
                                            {s.phone && (
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground">Telefone</p>
                                                    <p className="text-sm font-bold">{s.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-dashed border-border/20">
                                            <Button onClick={() => handleOpenModal('purchase', s)} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 font-black uppercase text-[10px] flex-grow h-10">
                                                <ShoppingCart size={14} className="mr-2"/> Comprar
                                            </Button>
                                            <Button onClick={() => handleOpenModal('history', s)} variant="outline" size="sm" className="flex-grow font-black uppercase text-[10px] h-10 border-border/40">
                                                <FileText size={14} className="mr-2"/> Histórico
                                            </Button>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button onClick={() => handleOpenModal('form', s)} variant="outline" size="icon" className="text-primary border-primary/20 hover:bg-primary/10 h-10 w-10 shrink-0">
                                                    <Edit size={14} />
                                                </Button>
                                                <Button onClick={() => handleOpenModal('delete', s)} variant="outline" size="icon" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-10 w-10 shrink-0">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                        {sortedSuppliers.map(s => (
                            <Card key={s.id} className="bg-card border-2 hover:border-primary/20 transition-all group overflow-hidden shadow-sm">
                                <CardHeader className="p-5 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                                            <Truck size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-base font-black uppercase truncate tracking-tight">{s.name}</CardTitle>
                                            <CardDescription className="text-[9px] font-bold uppercase text-muted-foreground">{s.contactPerson || 'Representante'}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 pt-0 space-y-3">
                                    <div className="space-y-1.5">
                                        {s.phone && <p className="text-[11px] font-bold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"/> {s.phone}</p>}
                                        {s.email && <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/20"/> {s.email}</p>}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-2 bg-muted/20 flex gap-1">
                                    <Button onClick={() => handleOpenModal('purchase', s)} variant="ghost" size="icon" className="h-9 w-9 text-accent"><ShoppingCart size={18}/></Button>
                                    <Button onClick={() => handleOpenModal('history', s)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><FileText size={18}/></Button>
                                    <Button onClick={() => handleOpenModal('form', s)} variant="ghost" size="icon" className="h-9 w-9 text-primary"><Edit size={18}/></Button>
                                    <Button onClick={() => handleOpenModal('delete', s)} variant="ghost" size="icon" className="h-9 w-9 text-destructive"><Trash2 size={18}/></Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {modalState.form && <SupplierFormModal supplier={selectedSupplier} open={modalState.form} onOpenChange={closeAllModals} onSave={saveSupplier} />}
                {modalState.purchase && <PurchaseModal open={modalState.purchase} onOpenChange={closeAllModals} suppliers={suppliers} products={products} preselectedSupplier={selectedSupplier || undefined} onSavePurchase={recordPurchaseAndUpdateStock} onSaveProduct={saveProduct} />}
                {modalState.history && selectedSupplier && <PurchaseHistoryModal supplier={selectedSupplier} open={modalState.history} onOpenChange={closeAllModals} />}
                {selectedSupplier && modalState.delete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent className="rounded-3xl p-8 border-border/40 bg-card shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black uppercase text-destructive tracking-tight text-lg">Excluir Fornecedor?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground mt-2">
                                    Deseja remover &quot;{selectedSupplier.name}&quot;?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-2">
                                <AlertDialogCancel className="h-12 font-black uppercase text-[10px] rounded-xl">Não</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => { if (selectedSupplier.id) await deleteSupplier(selectedSupplier.id); closeAllModals(); }} className="bg-destructive text-white h-12 font-black uppercase text-[10px] rounded-xl">Sim, Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};
