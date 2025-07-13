'use client';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '../spinner';
import { CustomerFormModal } from './customer-form-modal';

export const PaymentModal = ({ subtotal, customers, userId, onFinalize, isProcessing, open, onOpenChange, showNotification }) => {
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [discount, setDiscount] = useState(0);
    const [surcharge, setSurcharge] = useState(0);
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

    const finalTotal = useMemo(() => {
        return (Number(subtotal) || 0) - (Number(discount) || 0) + (Number(surcharge) || 0);
    }, [subtotal, discount, surcharge]);

    const handleCustomerChange = (value) => {
        if (value === 'add_new_customer') {
            setIsNewCustomerModalOpen(true);
        } else {
            setSelectedCustomer(value);
        }
    };

    const handleFinalize = () => {
        if (paymentMethod === 'Fiado' && !selectedCustomer) {
            showNotification("Por favor, selecione um cliente para a venda fiado.", "error");
            return;
        }
        onFinalize(paymentMethod, selectedCustomer, Number(discount) || 0, Number(surcharge) || 0);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4 text-muted-foreground">
                        <div className="flex justify-between"><span>Subtotal:</span><span>R$ {(Number(subtotal) || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="desconto">Desconto (R$):</Label>
                            <Input type="number" id="desconto" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-28 text-right"/>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="acrescimo">Acréscimo (R$):</Label>
                            <Input type="number" id="acrescimo" value={surcharge} onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)} className="w-28 text-right"/>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-green-400 border-t border-border pt-3 mt-3"><span>Total Final:</span><span>R$ {(Number(finalTotal) || 0).toFixed(2)}</span></div>
                    </div>
                    <div className="mb-4">
                        <Label>Forma de Pagamento:</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="Débito">Débito</SelectItem>
                                <SelectItem value="Crédito">Crédito</SelectItem>
                                <SelectItem value="Fiado">Fiado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {paymentMethod === 'Fiado' && (
                        <div className="mb-6 animate-fade-in">
                            <Label>Cliente:</Label>
                            <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                                <SelectTrigger><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    <SelectItem value="add_new_customer" className="text-primary">+ Adicionar Novo Cliente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleFinalize} disabled={isProcessing || (paymentMethod === 'Fiado' && !selectedCustomer)} className="w-full bg-green-600 text-white font-bold py-3 hover:bg-green-500">
                            {isProcessing ? <Spinner /> : 'Confirmar Pagamento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {isNewCustomerModalOpen && (
                <CustomerFormModal 
                    open={isNewCustomerModalOpen}
                    onOpenChange={setIsNewCustomerModalOpen}
                    userId={userId} 
                    onSuccess={(newCustomerId) => {
                        setSelectedCustomer(newCustomerId);
                        setIsNewCustomerModalOpen(false);
                    }}
                    showNotification={showNotification}
                />
            )}
        </>
    );
};
