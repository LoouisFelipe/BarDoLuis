
'use client';
import React, { useState } from 'react';
import { getDb, appId } from '@/lib/firebase';
import { doc, writeBatch, collection } from 'firebase/firestore';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';

export const CustomerPaymentModal = ({ customerForPayment, open, onOpenChange, userId }) => {
    const [amount, setAmount] = useState(customerForPayment.balance || 0);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const db = getDb();
        if (!db) return;

        if (amount <= 0 || amount > customerForPayment.balance) {
            alert("Valor de pagamento inválido.");
            return;
        }
        setProcessing(true);
        const customerRef = doc(db, `artifacts/${appId}/users/${userId}/customers`, customerForPayment.id);
        try {
            const batch = writeBatch(db);
            
            batch.update(customerRef, { balance: customerForPayment.balance - amount });
            
            const transactionData = {
                timestamp: new Date(),
                type: 'payment',
                description: `Pagamento Fiado - ${customerForPayment.name}`,
                total: amount,
                customerId: customerForPayment.id
            };
            batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/transactions`)), transactionData);

            await batch.commit();
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao registrar pagamento: ", error);
            alert("Ocorreu um erro ao registrar o pagamento.");
        } finally {
            setProcessing(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Receber Pagamento de {customerForPayment.name}</DialogTitle>
                        <DialogDescription>Dívida total: R$ {(Number(customerForPayment.balance) || 0).toFixed(2)}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label htmlFor="amount">Valor a Pagar (R$)</Label>
                        <Input 
                            type="number" step="0.01" id="amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
                            className="text-2xl font-bold h-auto"
                            max={customerForPayment.balance} min="0.01" required 
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing} className="w-full bg-green-600 hover:bg-green-500 text-white">
                            {processing ? <Spinner /> : 'Confirmar Recebimento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
