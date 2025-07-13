'use client';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Beer, Wine, Boxes, PlusCircle, Soup } from 'lucide-react';

export const AddItemsModal = ({ products, onAddItem, open, onOpenChange, onAddNewProduct, showNotification }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductForDose, setSelectedProductForDose] = useState(null);
    const [isManualDoseView, setIsManualDoseView] = useState(false);
    const [manualDose, setManualDose] = useState({ size: '', price: '' });

    const groupedProducts = useMemo(() => {
        const filtered = products.filter(p => (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.subcategoria && p.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()))) && (p.saleType === 'combo' ? true : p.stock > 0));
        return filtered.reduce((acc, product) => {
            const category = product.categoria || 'Outros';
            if (!acc[category]) acc[category] = [];
            acc[category].push(product);
            return acc;
        }, {});
    }, [products, searchTerm]);

    const handleProductClick = (product) => {
        if (product.saleType === 'unit' || product.saleType === 'combo') {
            onAddItem(product, product.saleType, { price: product.unitPrice });
        } else {
            setSelectedProductForDose(product);
        }
    };

    const handleSelectDose = (dose) => {
        onAddItem(selectedProductForDose, 'dose', { price: dose.price, size: dose.size, doseName: dose.name });
        setSelectedProductForDose(null);
    };
    
    const handleManualDoseSubmit = (e) => {
        e.preventDefault();
        const size = parseFloat(manualDose.size);
        const price = parseFloat(manualDose.price);
        if (!size || !price || size <= 0 || price <= 0) {
            showNotification("Por favor, insira um volume e um preço válidos.", "error");
            return;
        }
        onAddItem(selectedProductForDose, 'dose', { price: price, size: size, doseName: `Dose Manual (${size}ml)` });
        setSelectedProductForDose(null);
        setIsManualDoseView(false);
        setManualDose({ size: '', price: '' });
    };

    const handleClose = (isOpen) => {
        if (!isOpen) {
            setSelectedProductForDose(null);
            setIsManualDoseView(false);
            setManualDose({ size: '', price: '' });
        }
        onOpenChange(isOpen);
    };

    const renderContent = () => {
        if (selectedProductForDose) {
            if (isManualDoseView) {
                return (
                    <div>
                        <DialogHeader>
                            <DialogTitle>Dose Manual: {selectedProductForDose.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleManualDoseSubmit} className="space-y-4 py-4">
                            <div><Label>Volume (ml)</Label><Input type="number" placeholder="50" value={manualDose.size} onChange={(e) => setManualDose({ ...manualDose, size: e.target.value })} required autoFocus /></div>
                            <div><Label>Preço (R$)</Label><Input type="number" step="0.01" placeholder="10.00" value={manualDose.price} onChange={(e) => setManualDose({ ...manualDose, price: e.target.value })} required /></div>
                            <DialogFooter className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={() => setIsManualDoseView(false)}>Voltar</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-500">Adicionar</Button>
                            </DialogFooter>
                        </form>
                    </div>
                );
            } else {
                return (
                    <div>
                        <DialogHeader>
                            <DialogTitle>Selecionar Dose: {selectedProductForDose.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            {selectedProductForDose.doseOptions.filter(d => d.enabled).map((dose, index) => (
                                <Button key={index} onClick={() => handleSelectDose(dose)} className="w-full h-auto py-4 text-lg font-semibold">{dose.name} - R$ {(Number(dose.price) || 0).toFixed(2)}</Button>
                            ))}
                            <Button onClick={() => setIsManualDoseView(true)} variant="outline" className="w-full h-auto py-4 text-lg font-semibold border-teal-500 text-teal-500 hover:bg-teal-500/10 hover:text-teal-400">Outra (Manual)</Button>
                            <Button onClick={() => setSelectedProductForDose(null)} variant="ghost" className="w-full mt-4">Voltar para Produtos</Button>
                        </div>
                    </div>
                );
            }
        } else {
            return (
                <>
                    <DialogHeader className="flex flex-row justify-between items-center mb-4">
                         <DialogTitle className="text-2xl">Adicionar Itens</DialogTitle>
                         <Button onClick={onAddNewProduct} size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80"><PlusCircle size={16} className="mr-2"/>Novo Produto</Button>
                    </DialogHeader>
                    <Input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-4" />
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {Object.keys(groupedProducts).sort().map(category => (
                            <div key={category} className="mb-6">
                                <h4 className="text-xl font-bold text-primary mb-3 border-b-2 border-border pb-2">{category}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {groupedProducts[category].map(product => (
                                        <Button key={product.id} onClick={() => handleProductClick(product)} variant="secondary" className="h-auto flex-col p-3 text-center transition-all duration-200 disabled:opacity-50" disabled={product.stock <= 0 && product.saleType !== 'combo'}>
                                            {product.categoria === 'Comidas' ? <Soup size={32} className="mx-auto mb-2 text-orange-400" /> : product.saleType === 'combo' ? <Boxes size={32} className="mx-auto mb-2 text-purple-400" /> : product.saleType === 'unit' ? <Beer size={32} className="mx-auto mb-2 text-yellow-400" /> : <Wine size={32} className="mx-auto mb-2 text-red-400" />}
                                            <p className="text-foreground font-semibold text-sm whitespace-normal">{product.name} {product.subcategoria && `(${product.subcategoria})`}</p>
                                            {product.saleType !== 'combo' && <p className={`text-xs ${product.stock <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{product.stock <= 0 ? "Esgotado" : `Estoque: ${product.stock}`}</p>}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            );
        }
    };

    return <Dialog open={open} onOpenChange={handleClose}><DialogContent className="max-w-3xl">{renderContent()}</DialogContent></Dialog>;
};
