
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDb, appId, doc, addDoc, updateDoc, writeBatch, collection, getDoc } from '@/lib/firebase';

import { NewComandaModal } from './modals/new-comanda-modal';
import { AddItemsModal } from './modals/add-items-modal';
import { PaymentModal } from './modals/payment-modal';
import { ProductFormModal } from './modals/product-form-modal';
import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';

import { ClipboardList, ChevronsRight, PlusCircle, Plus, Minus } from 'lucide-react';

export const TabComandas = ({ products, customers, comandas, loading, userId, showNotification }) => {
    const [selectedComanda, setSelectedComanda] = useState(null);
    const [isNewComandaModalOpen, setNewComandaModalOpen] = useState(false);
    const [isAddItemsModalOpen, setAddItemsModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

    useEffect(() => {
        if (selectedComanda) {
            const updatedComanda = comandas.find(c => c.id === selectedComanda.id);
            setSelectedComanda(updatedComanda || null);
        } else if (!loading && comandas && comandas.length > 0) {
            // Auto-select first comanda if none is selected
            // setSelectedComanda(comandas[0]);
        }
    }, [comandas, selectedComanda, loading]);

    const handleCreateComanda = useCallback(async (name, observations, customerId) => {
        const db = getDb();
        if (!db || !name.trim()) {
            showNotification("O nome da comanda não pode ser vazio.", "error");
            return;
        }
        
        setProcessing(true);
        const newComanda = { name, observations, customerId: customerId || null, status: 'open', items: [], total: 0, createdAt: new Date() };
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/comandas`), newComanda);
            setSelectedComanda({ id: docRef.id, ...newComanda });
            setNewComandaModalOpen(false);
            showNotification(`Comanda "${name}" criada com sucesso!`, "success");
        } catch (error) {
            console.error("Erro ao criar comanda: ", error);
            showNotification("Erro ao criar comanda.", "error");
        } finally {
            setProcessing(false);
        }
    }, [userId, showNotification]);

    const updateComandaItems = useCallback(async (comandaId, newItems) => {
        const db = getDb();
        if(!db) return;
        const comandaRef = doc(db, `artifacts/${appId}/users/${userId}/comandas`, comandaId);
        const newTotal = newItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.quantity || 1)), 0);
        await updateDoc(comandaRef, { items: newItems, total: newTotal });
    }, [userId]);

    const handleAddItemToComanda = useCallback((product, type, details) => {
        if (!selectedComanda) return;
        const existingItems = selectedComanda.items || [];
        const itemIdentifier = type === 'dose' ? `${product.id}_${details.doseName}` : product.id;
        const existingItemIndex = existingItems.findIndex(item => item.identifier === itemIdentifier);
        let newItems;
        if (existingItemIndex > -1) {
            newItems = existingItems.map((item, index) => index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
            newItems = [...existingItems, { identifier: itemIdentifier, productId: product.id, name: product.name, subcategoria: product.subcategoria, type, price: details.price, quantity: 1, size: details.size || null, doseName: details.doseName || null, baseUnit: product.baseUnit, comboItems: product.comboItems || [] }];
        }
        updateComandaItems(selectedComanda.id, newItems);
    }, [selectedComanda, updateComandaItems]);

    const handleUpdateQuantity = useCallback((itemIndex, change) => {
        if (!selectedComanda) return;
        const item = selectedComanda.items[itemIndex];
        const newQuantity = item.quantity + change;
        let newItems;
        if (newQuantity <= 0) newItems = selectedComanda.items.filter((_, index) => index !== itemIndex);
        else newItems = selectedComanda.items.map((it, index) => index === itemIndex ? { ...it, quantity: newQuantity } : it);
        updateComandaItems(selectedComanda.id, newItems);
    }, [selectedComanda, updateComandaItems]);

    const handleFinalizeSale = useCallback(async (paymentMethod, customerId = null, discount = 0, surcharge = 0) => {
        const db = getDb();
        if (!db || !selectedComanda || selectedComanda.items.length === 0) return;
        setProcessing(true);
        try {
            const batch = writeBatch(db);
            const finalTotal = selectedComanda.total - discount + surcharge;
            const saleDocData = { 
                timestamp: new Date(), 
                items: selectedComanda.items, 
                subtotal: selectedComanda.total,
                discount,
                surcharge,
                total: finalTotal, 
                paymentMethod, 
                customerId: customerId || selectedComanda.customerId, 
                comandaName: selectedComanda.name, 
                type: 'sale' 
            };
            batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/transactions`)), saleDocData);

            for (const item of selectedComanda.items) {
                const productRef = doc(db, `artifacts/${appId}/users/${userId}/products`, item.productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const productData = productDoc.data();
                    if (productData.saleType === 'combo' && productData.comboItems) {
                        for (const comboItem of productData.comboItems) {
                            const comboProductRef = doc(db, `artifacts/${appId}/users/${userId}/products`, comboItem.productId);
                            const comboProductDoc = await getDoc(comboProductRef);
                            if (comboProductDoc.exists()) {
                                const comboProductData = comboProductDoc.data();
                                const stockToDeduct = (comboItem.quantity || 1) * item.quantity;
                                batch.update(comboProductRef, { stock: (comboProductData.stock || 0) - stockToDeduct });
                            }
                        }
                    } else if (productData.saleType !== 'combo') {
                        const stockToDeduct = item.type === 'unit' ? item.quantity : (item.size || 0) * item.quantity;
                        batch.update(productRef, { stock: (productData.stock || 0) - stockToDeduct });
                    }
                }
            }
            if (paymentMethod === 'Fiado') {
                const finalCustomerId = customerId || selectedComanda.customerId;
                if(finalCustomerId) {
                    const customerRef = doc(db, `artifacts/${appId}/users/${userId}/customers`, finalCustomerId);
                    const customerDoc = await getDoc(customerRef);
                    if (customerDoc.exists()){
                        batch.update(customerRef, { balance: (customerDoc.data().balance || 0) + finalTotal });
                    }
                }
            }

            batch.delete(doc(db, `artifacts/${appId}/users/${userId}/comandas`, selectedComanda.id));

            await batch.commit();
            showNotification(`Venda de R$ ${finalTotal.toFixed(2)} finalizada!`, "success");
            setSelectedComanda(null);
            setPaymentModalOpen(false);
        } catch (error) {
            console.error("Erro ao finalizar venda: ", error);
            showNotification("Erro ao finalizar venda.", "error");
        } finally {
            setProcessing(false);
        }
    }, [selectedComanda, userId, showNotification]);

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-1">
            <div className="lg:col-span-1 bg-card rounded-xl p-4 flex flex-col h-[calc(100vh-150px)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground flex items-center"><ClipboardList className="mr-2" /> Comandas</h2>
                    <Button onClick={() => setNewComandaModalOpen(true)} size="icon" className="bg-primary hover:bg-primary/80"><Plus size={20} /></Button>
                </div>
                <div className="overflow-y-auto flex-grow pr-2 space-y-2">
                    {comandas.map(comanda => (
                        <button key={comanda.id} onClick={() => setSelectedComanda(comanda)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedComanda?.id === comanda.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
                            <p className="font-semibold">{comanda.name}</p>
                            <p className="text-sm text-muted-foreground">Total: R$ {(Number(comanda.total) || 0).toFixed(2)}</p>
                        </button>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-2 bg-card rounded-xl p-4 flex flex-col h-[calc(100vh-150px)]">
                {!selectedComanda ? (
                    <div className="flex flex-col justify-center items-center h-full text-muted-foreground"><ChevronsRight size={48} className="mb-4" /><p className="text-xl text-center">Selecione ou crie uma comanda</p></div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{selectedComanda.name}</h2>
                                {selectedComanda.customerId && <p className="text-sm text-primary mt-1 font-semibold">Cliente: {customerMap.get(selectedComanda.customerId) || '...'}</p>}
                                {selectedComanda.observations && <p className="text-sm text-muted-foreground mt-1">{selectedComanda.observations}</p>}
                            </div>
                            <Button onClick={() => setAddItemsModalOpen(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80"><PlusCircle className="mr-2" size={20} /> Adicionar Itens</Button>
                        </div>
                        <div className="flex-grow overflow-y-auto bg-background rounded-lg p-2 mb-4">
                            {selectedComanda.items.length === 0 ? <p className="text-muted-foreground text-center mt-8">Nenhum item na comanda.</p> : (
                                <ul className="space-y-2">
                                    {selectedComanda.items.map((item, index) => (
                                        <li key={`${item.identifier}-${index}`} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                                            <div><p className="font-semibold text-foreground">{item.name} {item.subcategoria && `(${item.subcategoria})`} {item.doseName ? `(${item.doseName})` : ''}</p><p className="text-xs text-muted-foreground">R$ {(Number(item.price) || 0).toFixed(2)} / un.</p></div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 bg-muted rounded-full">
                                                    <Button onClick={() => handleUpdateQuantity(index, -1)} size="icon" variant="ghost" className="h-6 w-6 text-destructive"><Minus size={16} /></Button>
                                                    <span className="font-bold text-foreground w-6 text-center">{item.quantity}</span>
                                                    <Button onClick={() => handleUpdateQuantity(index, 1)} size="icon" variant="ghost" className="h-6 w-6 text-green-500"><Plus size={16} /></Button>
                                                </div>
                                                <p className="text-foreground font-bold w-20 text-right">R$ {((Number(item.price) || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="border-t-2 border-border pt-4">
                            <div className="flex justify-between items-center text-xl font-bold text-foreground mb-4"><span>Total:</span><span>R$ {(Number(selectedComanda.total) || 0).toFixed(2)}</span></div>
                            <Button onClick={() => setPaymentModalOpen(true)} disabled={selectedComanda.items.length === 0 || processing} className="w-full bg-green-600 text-white font-bold py-3 text-lg hover:bg-green-500 disabled:bg-muted-foreground">{processing ? <Spinner /> : 'Fechar Conta'}</Button>
                        </div>
                    </>
                )}
            </div>
            {isNewComandaModalOpen && <NewComandaModal customers={customers} userId={userId} onCreate={handleCreateComanda} processing={processing} onClose={() => setNewComandaModalOpen(false)} showNotification={showNotification} />}
            {isAddItemsModalOpen && <AddItemsModal products={products} onAddItem={handleAddItemToComanda} open={isAddItemsModalOpen} onOpenChange={setAddItemsModalOpen} onAddNewProduct={() => { setAddItemsModalOpen(false); setIsNewProductModalOpen(true); }} showNotification={showNotification} />}
            {isNewProductModalOpen && <ProductFormModal open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen} userId={userId} allProducts={products} showNotification={showNotification} />}
            {isPaymentModalOpen && selectedComanda && <PaymentModal open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen} subtotal={selectedComanda.total} customers={customers} userId={userId} onFinalize={handleFinalizeSale} isProcessing={processing} showNotification={showNotification}/>}
        </div>
    );
};
