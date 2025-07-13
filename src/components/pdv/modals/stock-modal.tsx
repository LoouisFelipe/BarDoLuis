
'use client';
import React, { useState } from 'react';
import { getDb, appId } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';

export const StockModal = ({ product, open, onOpenChange, userId }) => { 
    const [amount, setAmount] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const db = getDb();
        if (!db) return;

        if (amount <= 0) {
            alert("A quantidade deve ser maior que zero.");
            return;
        }
        setProcessing(true);
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/products`, product.id);
        const stockToAdd = product.saleType === 'unit' ? amount : amount * product.baseUnitSize;
        
        try {
            const productDoc = await getDoc(docRef);
            const currentStock = productDoc.data()?.stock || 0;
            await updateDoc(docRef, { stock: currentStock + stockToAdd });
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao atualizar estoque: ", error);
            alert("Ocorreu um erro ao atualizar o estoque.");
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
                        <Label htmlFor="amount">Quantidade de {product.saleType === 'unit' ? 'unidades' : 'garrafas'} a adicionar:</Label>
                        <Input 
                            type="number" id="amount" value={amount} onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)} 
                            min="1" required 
                        />
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
