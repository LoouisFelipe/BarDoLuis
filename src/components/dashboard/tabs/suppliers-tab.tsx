'use client';
import React, { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Truck, PlusCircle, ShoppingCart, FileText, Edit, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { Supplier } from '@/lib/schemas';
import { SupplierFormModal } from '@/components/suppliers/supplier-form-modal';
import { PurchaseModal } from '@/components/suppliers/purchase-modal';
import { PurchaseHistoryModal } from '@/components/suppliers/purchase-history-modal';

export const SuppliersTab: React.FC = () => {
    const { suppliers, products, loading, saveSupplier, deleteSupplier, recordPurchaseAndUpdateStock, saveProduct } = useData();
    
    const [modalState, setModalState] = useState({ form: false, purchase: false, history: false, delete: false });
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

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

    const renderAccordionView = () => (
        <Accordion type="multiple" className="space-y-4" defaultValue={suppliers.map(s => s.id!)}>
            {suppliers.map(s => (
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

    return (
        <>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                        <Truck className="mr-3" /> Gerenciar Fornecedores
                    </h2>
                    <Button onClick={() => handleOpenModal('form')} className="bg-primary text-primary-foreground font-bold hover:bg-primary/80 w-full md:w-auto h-11">
                        <PlusCircle className="mr-2" size={20} /> Novo Fornecedor
                    </Button>
                </div>
                
                {suppliers.length === 0 ? (
                    <div className="text-center text-muted-foreground p-10 bg-card rounded-xl border border-dashed">
                        <Truck size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-foreground">Nenhum fornecedor cadastrado</h3>
                        <p className="max-w-sm mx-auto mt-2 mb-6">Cadastre seus fornecedores para registrar compras e custos de mercadorias.</p>
                        <Button onClick={() => handleOpenModal('form')}>Adicionar Fornecedor</Button>
                    </div>
                ) : (
                   renderAccordionView()
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
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80 text-white">
                                    Sim, excluir fornecedor
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </>
    );
};