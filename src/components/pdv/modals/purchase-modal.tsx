'use client';
import React, { useState, useMemo } from 'react';
import { getDb, appId, writeBatch, doc, getDoc, collection } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '../spinner';
import { ProductFormModal } from './product-form-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lightbulb, PlusCircle, Trash2 } from 'lucide-react';

export const PurchaseModal = ({ open, onOpenChange, userId, suppliers, products, preselectedSupplier, showNotification }) => {
    const [supplierId, setSupplierId] = useState(preselectedSupplier?.id || '');
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [initialProductName, setInitialProductName] = useState('');

    const availableProducts = useMemo(() => {
        if (!productSearch) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(productSearch.toLowerCase()) && 
            p.saleType !== 'combo' &&
            !purchaseItems.some(item => item.productId === p.id)
        );
    }, [products, productSearch, purchaseItems]);

    const handleAddProduct = (product) => {
        setPurchaseItems(prev => [...prev, {
            productId: product.id,
            name: product.name,
            quantity: '',
            unitCost: product.costPrice || ''
        }]);
        setProductSearch('');
    };

    const handleOpenNewProductModal = (name = '') => {
        setInitialProductName(name);
        setIsNewProductModalOpen(true);
    };

    const handleNewProductSuccess = (newProduct) => {
        handleAddProduct(newProduct);
        setIsNewProductModalOpen(false);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...purchaseItems];
        newItems[index][field] = value;
        setPurchaseItems(newItems);
    };

    const handleRemoveItem = (index) => {
        setPurchaseItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalCost = useMemo(() => {
        return purchaseItems.reduce((total, item) => {
            const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
            return total + itemTotal;
        }, 0);
    }, [purchaseItems]);

    const handleSubmit = async () => {
        if (!supplierId) {
            showNotification("Selecione um fornecedor.", "error");
            return;
        }
        if (purchaseItems.length === 0) {
            showNotification("Adicione pelo menos um produto à compra.", "error");
            return;
        }
        if (purchaseItems.some(item => !item.quantity || item.unitCost === '' || Number(item.quantity) <= 0 || Number(item.unitCost) < 0)) {
            showNotification("Verifique se todos os itens têm quantidade e custo unitário válidos.", "error");
            return;
        }
        
        setProcessing(true);
        const db = getDb();
        if (!db) {
            setProcessing(false);
            return;
        };

        try {
            const batch = writeBatch(db);
            const purchaseData = {
                supplierId,
                supplierName: suppliers.find(s => s.id === supplierId)?.name || 'N/A',
                items: purchaseItems.map(item => ({...item, quantity: parseFloat(item.quantity), unitCost: parseFloat(item.unitCost)})),
                totalCost,
                createdAt: new Date()
            };
            
            batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/purchases`)), purchaseData);

            const expenseData = {
                description: `Compra - ${purchaseData.supplierName}`,
                total: totalCost,
                timestamp: purchaseData.createdAt,
                type: 'expense',
                supplierId: supplierId,
                items: purchaseData.items,
            };
            batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/transactions`)), expenseData);

            for (const item of purchaseData.items) {
                const productRef = doc(db, `artifacts/${appId}/users/${userId}/products`, item.productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const productData = productDoc.data();
                    const currentStock = productData.stock || 0;
                    const stockToAdd = productData.saleType === 'unit' ? item.quantity : item.quantity * (productData.baseUnitSize || 1);
                    batch.update(productRef, {
                        stock: currentStock + stockToAdd,
                        costPrice: item.unitCost
                    });
                }
            }

            await batch.commit();
            showNotification("Compra registada com sucesso!", "success");
            onOpenChange(false);

        } catch (error) {
            console.error("Erro ao registar compra: ", error);
            showNotification("Ocorreu um erro ao registar a compra.", "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <TooltipProvider>
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Registar Nova Compra</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div>
                        <Label>Fornecedor</Label>
                        <Select value={supplierId} onValueChange={setSupplierId} disabled={!!preselectedSupplier}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um fornecedor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-secondary p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Itens da Compra</h4>
                        <div className="space-y-3">
                            {purchaseItems.map((item, index) => {
                                const suggestedPrice = (parseFloat(item.unitCost) || 0) * 2.5;
                                return (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-background p-3 rounded-md">
                                        <span className="md:col-span-4 font-medium">{item.name}</span>
                                        <div className="md:col-span-2"><Input type="number" placeholder="Qtd" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} /></div>
                                        <div className="md:col-span-3">
                                            <Input type="number" step="0.01" placeholder="Custo/Un" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} />
                                            {suggestedPrice > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center text-xs text-yellow-400 mt-1 cursor-help"><Lightbulb size={14} className="mr-1" /><span>Sugestão Venda: R$ {suggestedPrice.toFixed(2)}</span></div>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Sugestão com base em 150% de markup (custo x 2.5)</p></TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <span className="md:col-span-2 text-right font-semibold">R$ {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}</span>
                                        <Button onClick={() => handleRemoveItem(index)} variant="ghost" size="icon" className="md:col-span-1 text-destructive hover:text-red-300 flex justify-end"><Trash2 size={18} /></Button>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {purchaseItems.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum item adicionado.</p>}

                        <div className="mt-4 relative">
                             <Input type="text" placeholder="Pesquisar produto para adicionar..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                            {productSearch && (
                                <div className="absolute w-full z-10 max-h-40 overflow-y-auto bg-popover border rounded-b-md">
                                    <ScrollArea className="h-full">
                                        {availableProducts.map(p => (
                                            <div key={p.id} onClick={() => handleAddProduct(p)} className="p-2 hover:bg-primary/20 cursor-pointer">{p.name}</div>
                                        ))}
                                        {!availableProducts.some(p => p.name.toLowerCase() === productSearch.toLowerCase()) && (
                                            <div onClick={() => handleOpenNewProductModal(productSearch)} className="p-2 text-primary hover:bg-primary/20 cursor-pointer flex items-center">
                                                <PlusCircle size={16} className="mr-2"/> Criar novo produto: "{productSearch}"
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-right text-2xl font-bold text-green-400 border-t border-border pt-4 mt-4">
                        <span>Total da Compra: R$ {totalCost.toFixed(2)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={processing} className="w-full bg-green-600 hover:bg-green-500">
                        {processing ? <Spinner /> : 'Finalizar e Registar Compra'}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
            {isNewProductModalOpen && (
                <ProductFormModal 
                    open={isNewProductModalOpen}
                    onOpenChange={setIsNewProductModalOpen}
                    userId={userId}
                    allProducts={products}
                    showNotification={showNotification}
                    onSuccess={handleNewProductSuccess}
                    initialName={initialProductName}
                />
            )}
        </TooltipProvider>
    );
};
