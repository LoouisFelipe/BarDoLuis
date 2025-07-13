'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Spinner } from './spinner';
import { SupplierFormModal } from './modals/supplier-form-modal';
import { PurchaseModal } from './modals/purchase-modal';
import { PurchaseHistoryModal } from './modals/purchase-history-modal';
import { Truck, PlusCircle, ShoppingCart, FileText, Edit } from 'lucide-react';

export const TabFornecedores = ({ suppliers, products, loading, userId, showNotification }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const handleEdit = (supplier) => { setSelectedSupplier(supplier); setFormModalOpen(true); };
    const handleAddNew = () => { setSelectedSupplier(null); setFormModalOpen(true); };
    const handlePurchase = (supplier) => { setSelectedSupplier(supplier); setPurchaseModalOpen(true); };
    const handleHistory = (supplier) => { setSelectedSupplier(supplier); setHistoryModalOpen(true); };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <TooltipProvider>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-foreground flex items-center"><Truck className="mr-3" /> Gerir Fornecedores</h2>
                    <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80">
                        <PlusCircle className="mr-2" size={20} /> Novo Fornecedor
                    </Button>
                </div>
                {suppliers.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8 bg-card rounded-lg">
                        <Truck size={48} className="mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground">Nenhum fornecedor registado</h3>
                        <p className="max-w-sm mx-auto mt-2 mb-6">Registe os seus fornecedores para controlar as compras e os custos das mercadorias.</p>
                        <Button onClick={handleAddNew}>Adicionar Fornecedor</Button>
                    </div>
                ) : (
                    <div className="bg-card rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliers.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.contactPerson}</TableCell>
                                            <TableCell>{s.phone}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Tooltip><TooltipTrigger asChild><Button onClick={() => handlePurchase(s)} variant="ghost" size="icon" className="text-green-400 hover:text-green-300"><ShoppingCart size={20} /></Button></TooltipTrigger><TooltipContent>Registar Compra</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button onClick={() => handleHistory(s)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><FileText size={20} /></Button></TooltipTrigger><TooltipContent>Histórico de Compras</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button onClick={() => handleEdit(s)} variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300"><Edit size={20} /></Button></TooltipTrigger><TooltipContent>Editar Fornecedor</TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
                {isFormModalOpen && <SupplierFormModal supplier={selectedSupplier} open={isFormModalOpen} onOpenChange={setFormModalOpen} userId={userId} showNotification={showNotification} />}
                {isPurchaseModalOpen && <PurchaseModal open={isPurchaseModalOpen} onOpenChange={setPurchaseModalOpen} userId={userId} suppliers={suppliers} products={products} preselectedSupplier={selectedSupplier} showNotification={showNotification} />}
                {isHistoryModalOpen && <PurchaseHistoryModal supplier={selectedSupplier} userId={userId} open={isHistoryModalOpen} onOpenChange={setHistoryModalOpen} />}
            </div>
        </TooltipProvider>
    );
};
