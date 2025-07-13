'use client';
import React, { useState, useEffect } from 'react';
import { getDb, appId, setDoc, addDoc, doc, collection } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';

export const SupplierFormModal = ({ supplier, open, onOpenChange, userId, showNotification }) => {
    const [formData, setFormData] = useState({ name: '', contactPerson: '', phone: '', email: '' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (supplier) {
            setFormData({ 
                name: supplier.name || '', 
                contactPerson: supplier.contactPerson || '', 
                phone: supplier.phone || '', 
                email: supplier.email || '' 
            });
        } else {
            setFormData({ name: '', contactPerson: '', phone: '', email: '' });
        }
    }, [supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const db = getDb();
        if (!db) return;
        
        const collectionPath = `artifacts/${appId}/users/${userId}/suppliers`;
        try {
            if (supplier) {
                await setDoc(doc(db, collectionPath, supplier.id), formData, { merge: true });
                showNotification("Fornecedor atualizado com sucesso!", "success");
            } else {
                await addDoc(collection(db, collectionPath), formData);
                showNotification("Fornecedor adicionado com sucesso!", "success");
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao salvar fornecedor: ", error);
            showNotification("Ocorreu um erro ao salvar o fornecedor.", "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div><Label htmlFor="name">Nome da Empresa</Label><Input id="name" name="name" placeholder="Nome da Empresa" value={formData.name} onChange={handleChange} required /></div>
                        <div><Label htmlFor="contactPerson">Pessoa de Contato</Label><Input id="contactPerson" name="contactPerson" placeholder="Pessoa de Contato (opcional)" value={formData.contactPerson} onChange={handleChange} /></div>
                        <div><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" type="tel" placeholder="Telefone" value={formData.phone} onChange={handleChange} /></div>
                        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="Email (opcional)" value={formData.email} onChange={handleChange} /></div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing ? <Spinner /> : 'Salvar Fornecedor'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
