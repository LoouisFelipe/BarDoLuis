'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';
import { CustomerFormModal } from './customer-form-modal';

export const NewComandaModal = ({ onCreate, onClose, customers, userId, processing, showNotification }) => {
    const [name, setName] = useState('');
    const [observations, setObservations] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

    const handleCustomerChange = (value) => {
        if (value === 'add_new_customer') {
            setIsNewCustomerModalOpen(true);
        } else {
            setSelectedCustomer(value);
        }
    };

    const handleNewCustomerSuccess = (newCustomerId) => {
        setSelectedCustomer(newCustomerId);
        setIsNewCustomerModalOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(name, observations, selectedCustomer);
    };

    return (
        <>
            <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Comanda</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Mesa 5 ou João" autoFocus required />
                            <Textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Observações (opcional)" rows="2" />
                            <div>
                                <Label>Associar Cliente (Opcional)</Label>
                                <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nenhum cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Nenhum cliente</SelectItem>
                                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        <SelectItem value="add_new_customer" className="text-primary">+ Adicionar Novo Cliente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? <Spinner /> : 'Criar Comanda'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {isNewCustomerModalOpen && (
                <CustomerFormModal 
                    open={isNewCustomerModalOpen}
                    onOpenChange={setIsNewCustomerModalOpen} 
                    userId={userId} 
                    onSuccess={handleNewCustomerSuccess}
                    showNotification={showNotification}
                />
            )}
        </>
    );
};
