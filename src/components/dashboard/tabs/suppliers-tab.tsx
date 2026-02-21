'use client';
import React, { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
import { cn } from '@/lib/utils';

/**
 * @fileOverview Gestão de Fornecedores com Opções de Lista/Cards.
 * CTO: Correção de importações ausentes (CardDescription, TooltipProvider).
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
    
    const handleDeleteClick = (supplier: Supplier) => handleOpenModal('delete', supplier);
    
    const confirmDelete = async () => {
        if (selectedSupplier && selectedSupplier.id) {
            await deleteSupplier(selectedSupplier.id);
            closeAllModals();
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const renderAccordionView = () => (
        <Accordion type="multiple" className="space-y-4" defaultValue={sortedSuppliers.map(s => s.id!)}>
            {sortedSuppliers.map(s => (
                <AccordionItem key={s.id} value={s.id!} className="bg-card rounded-xl border-b-0 shadow-sm overflow-hidden">
                    <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Truck size={18} className="text-muted-foreground" />
                            <span>{s.name}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                       <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {s.contactPerson && <p className="text-sm text-muted-foreground"><strong>Contato:</strong> {s.contactPerson}</p>}
                                {s.phone && <p className="text-sm text-muted-foreground"><strong>Telefone:</strong> {s.phone}</p>}
                                {s.email && <p className="text-sm text-muted-foreground"><strong>E-mail:</strong> {s.email}</p>}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                <Button 
                                    onClick={() => handleOpenModal('purchase', s)} 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-accent border-accent hover:bg-accent/10 hover:text-accent/80 flex-grow sm:flex-grow-0"
                                >
                                    <ShoppingCart size={14} className="mr-2"/> Registrar Compra
                                </Button>
                                <Button 
                                    onClick={() => handleOpenModal('history', s)} 
                                    variant="outline" 
                                    size="sm"
                                    className="flex-grow sm:flex-grow-0"
                                >
                                    <FileText size={14} className="mr-2"/> Histórico
                                </Button>
                                <Button 
                                    onClick={() => handleOpenModal('form', s)} 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-primary border-primary hover:bg-primary/10 hover:text-primary/80 flex-grow sm:flex-grow-0"
                                >
                                    <Edit size={14} className="mr-2"/> Editar
                                </Button>
                                <Button 
                                    onClick={() => handleDeleteClick(s)} 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive/80 flex-grow sm:flex-grow-0"
                                >
                                    <Trash2 size={14} className="mr-2"/> Excluir
                                </Button>
                            </div>
                       </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );

    const renderCardView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {sortedSuppliers.map(s => (
                <Card key={s.id} className="bg-card border-2 hover:border-primary/20 transition-all group overflow-hidden">
                    <CardHeader className="p-5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                                <Truck size={24} />
                            </div>
                            <div className="min-w-0">
                                <CardTitle className="text-base font-black uppercase truncate">{s.name}</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{s.contactPerson || 'Geral'}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-3">
                        <div className="space-y-1.5">
                            {s.phone && <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"/> {s.phone}</p>}
                            {s.email && <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/40"/> {s.email}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 bg-muted/20 flex items-center justify-between gap-1">
                        <div className="flex gap-1 w-full">
                            <Button onClick={() => handleOpenModal('purchase', s)} variant="ghost" size="icon" className="h-9 w-9 text-accent hover:bg-accent/10" title="Registrar Compra"><ShoppingCart size={18}/></Button>
                            <Button onClick={() => handleOpenModal('history', s)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted" title="Histórico"><FileText size={18}/></Button>
                            <Button onClick={() => handleOpenModal('form', s)} variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" title="Editar"><Edit size={18}/></Button>
                            <Button onClick={() => handleDeleteClick(s)} variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" title="Excluir"><Trash2 size={18}/></Button>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                        <Truck className="mr-3 text-primary" /> Fornecedores
                    </h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
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
                        <Button onClick={() => handleOpenModal('form')} className="bg-primary text-primary-foreground font-bold hover:bg-primary/80 flex-grow md:flex-grow-0 h-11 uppercase text-xs tracking-widest">
                            <PlusCircle className="mr-2" size={20} /> Novo Fornecedor
                        </Button>
                    </div>
                </div>
                
                {suppliers.length === 0 ? (
                    <div className="text-center text-muted-foreground p-10 bg-card rounded-xl border border-dashed">
                        <Truck size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-foreground">Nenhum fornecedor cadastrado</h3>
                        <p className="max-w-sm mx-auto mt-2 mb-6">Cadastre seus fornecedores para registrar compras e custos de mercadorias.</p>
                        <Button onClick={() => handleOpenModal('form')}>Adicionar Fornecedor</Button>
                    </div>
                ) : (
                   viewMode === 'list' ? renderAccordionView() : renderCardView()
                )}

                {modalState.form && <SupplierFormModal supplier={selectedSupplier} open={modalState.form} onOpenChange={closeAllModals} onSave={saveSupplier} />}
                {modalState.purchase && <PurchaseModal open={modalState.purchase} onOpenChange={closeAllModals} suppliers={suppliers} products={products} preselectedSupplier={selectedSupplier || undefined} onSavePurchase={recordPurchaseAndUpdateStock} onSaveProduct={saveProduct} />}
                {modalState.history && selectedSupplier && <PurchaseHistoryModal supplier={selectedSupplier} open={modalState.history} onOpenChange={closeAllModals} />}
                
                {selectedSupplier && modalState.delete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor <strong>{selectedSupplier.name}</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={closeAllModals}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80 text-white font-bold">
                                    Sim, excluir fornecedor
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};
