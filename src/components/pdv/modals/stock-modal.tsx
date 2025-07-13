'use client';
import React, { useState } from 'react';
import { getDb, appId, doc, getDoc, updateDoc, writeBatch, collection } from '@/lib/firebase';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const StockModal = ({ product, open, onOpenChange, userId, suppliers, showNotification }) => { 
    const [amount, setAmount] = useState('');
    const [cost, setCost] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const db = getDb();
        if (!db) return;

        const numAmount = parseFloat(amount);
        const numCost = parseFloat(cost);

        if (numAmount <= 0) {
            showNotification("A quantidade deve ser maior que zero.", "error");
            return;
        }
        setProcessing(true);
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/products`, product.id);
        
        try {
            const batch = writeBatch(db);
            const productDoc = await getDoc(docRef);
            if (!productDoc.exists()) throw new Error("Produto não encontrado");
            
            const productData = productDoc.data();
            const currentStock = productData.stock || 0;
            const stockToAdd = product.saleType === 'unit' ? numAmount : numAmount * (product.baseUnitSize || 1);

            batch.update(docRef, { stock: currentStock + stockToAdd });
            
            if (numCost > 0) {
                const expenseData = {
                    description: `Compra de ${numAmount}x ${product.name}`,
                    total: numCost,
                    timestamp: new Date(),
                    type: 'expense',
                    supplierId: supplierId || null,
                    productId: product.id,
                };
                batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/transactions`)), expenseData);
            }

            await batch.commit();
            showNotification("Estoque atualizado com sucesso!", "success");
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao atualizar estoque: ", error);
            showNotification("Ocorreu um erro ao atualizar o estoque.", "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Adicionar Estoque: {product.name}</DialogTitle>
                        <DialogDescription>Estoque atual: {product.stock} {product.baseUnit}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="amount">Quantidade de {product.saleType === 'unit' ? 'unidades' : 'garrafas'} a adicionar:</Label>
                            <Input 
                                type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} 
                                min="1" required 
                            />
                        </div>
                        <div>
                            <Label htmlFor="cost">Custo Total da Compra (R$, opcional):</Label>
                            <Input 
                                type="number" id="cost" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Ex: 150.00"
                            />
                        </div>
                         <div>
                            <Label htmlFor="supplier">Fornecedor (opcional):</Label>
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Nenhum" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Nenhum</SelectItem>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing} className="w-full bg-green-600 hover:bg-green-500 text-white">
                            {processing ? <Spinner /> : 'Confirmar Entrada'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
