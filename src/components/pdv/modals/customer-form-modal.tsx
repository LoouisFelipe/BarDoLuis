
'use client';
import React, { useState, useEffect } from 'react';
import { getDb, appId } from '@/lib/firebase';
import { doc, addDoc, setDoc, collection } from 'firebase/firestore';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';

export const CustomerFormModal = ({ customer, open, onOpenChange, userId, onSuccess }) => { 
    const [formData, setFormData] = useState({ name: '', phone: '', balance: 0 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({ name: customer.name || '', phone: customer.phone || '', balance: customer.balance || 0 });
        } else {
            setFormData({ name: '', phone: '', balance: 0 });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const db = getDb();
        if (!db) return;

        setProcessing(true);
        const collectionPath = `artifacts/${appId}/users/${userId}/customers`;
        try {
            if (customer) {
                await setDoc(doc(db, collectionPath, customer.id), formData, { merge: true });
                onOpenChange(false);
            } else {
                const newDocRef = await addDoc(collection(db, collectionPath), { ...formData, balance: 0 });
                if (onSuccess) {
                    onSuccess(newDocRef.id);
                } else {
                    onOpenChange(false);
                }
            }
        } catch (error) {
            console.error("Erro ao salvar cliente: ", error);
            alert("Ocorreu um erro ao salvar o cliente.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{customer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input type="text" id="name" name="name" placeholder="Nome do Cliente" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="phone">Celular</Label>
                            <Input type="tel" id="phone" name="phone" placeholder="(XX) XXXXX-XXXX" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing ? <Spinner /> : 'Salvar Cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
