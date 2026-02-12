'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Lightbulb, PlusCircle, Trash2, ShoppingCart, Search } from 'lucide-react';
import { Product, Supplier, PurchaseItem } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

interface PurchaseItemState {
    productId: string;
    name: string;
    subcategory: string | null | undefined;
    quantity: string; 
    unitCost: string; 
}

interface PurchaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suppliers: Supplier[];
    products: Product[];
    preselectedSupplier?: Supplier;
    onSavePurchase: (supplierId: string, supplierName: string, items: PurchaseItem[], totalCost: number) => Promise<void>;
    onSaveProduct: (data: Omit<Product, 'id'>, id?: string) => Promise<string>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onOpenChange, suppliers, products, preselectedSupplier, onSavePurchase, onSaveProduct }) => {
    const { toast } = useToast();
    const [supplierId, setSupplierId] = useState(preselectedSupplier?.id || '');
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItemState[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [initialProduct, setInitialProduct] = useState<Partial<Product> | null>(null);

    useEffect(() => {
        if (open) {
            setSupplierId(preselectedSupplier?.id || '');
            setPurchaseItems([]);
            setProductSearch('');
            setProcessing(false);
        }
    }, [open, preselectedSupplier]);

    const availableProducts = useMemo(() => {
        if (!productSearch || productSearch.length < 2) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(productSearch.toLowerCase()) && 
            !purchaseItems.some(item => item.productId === p.id)
        ).slice(0, 5);
    }, [products, productSearch, purchaseItems]);

    const handleAddProduct = (product: Product) => {
        setPurchaseItems(prev => [...prev, {
            productId: product.id!,
            name: product.name,
            subcategory: product.subcategory,
            quantity: '',
            unitCost: String(product.costPrice || '')
        }]);
        setProductSearch('');
    };

    const handleOpenNewProductModal = (name = '') => {
        setInitialProduct({ name: name, saleType: 'unit' });
        setIsNewProductModalOpen(true);
    };
    
    const handleNewProductSaved = async (data: Omit<Product, 'id'>, id?: string) => {
        const newProductId = await onSaveProduct(data, id);
        setIsNewProductModalOpen(false);
        return newProductId;
    };


    const handleItemChange = (index: number, field: keyof PurchaseItemState, value: string) => {
        const newItems = [...purchaseItems];
        newItems[index][field] = value;
        setPurchaseItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setPurchaseItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalCost = useMemo(() => {
        return purchaseItems.reduce((total, item) => {
            const itemTotal = (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unitCost)) || 0);
            return total + itemTotal;
        }, 0);
    }, [purchaseItems]);

    const handleSubmit = async () => {
        if (!supplierId) {
            toast({ title: 'Fornecedor Faltando', description: 'Por favor, selecione um fornecedor.', variant: 'destructive' });
            return;
        }
        if (purchaseItems.length === 0) {
            toast({ title: 'Itens Faltando', description: 'Adicione pelo menos um produto à compra.', variant: 'destructive' });
            return;
        }
        
        const itemsToSave: PurchaseItem[] = [];
        for(const item of purchaseItems) {
            const quantity = parseFloat(item.quantity);
            const unitCost = parseFloat(item.unitCost);
            if (isNaN(quantity) || quantity <= 0) {
                toast({ title: 'Quantidade Inválida', description: `A quantidade para "${item.name}" deve ser um número positivo.`, variant: 'destructive' });
                return;
            }
             if (isNaN(unitCost) || unitCost < 0) {
                toast({ title: 'Custo Inválido', description: `O custo para "${item.name}" deve ser um número válido.`, variant: 'destructive' });
                return;
            }
            itemsToSave.push({
                productId: item.productId,
                name: item.name,
                quantity: quantity,
                unitCost: unitCost,
            });
        }
        
        setProcessing(true);
        const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'N/A';
        
        try {
            await onSavePurchase(supplierId, supplierName, itemsToSave, totalCost);
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao registrar compra: ", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <TooltipProvider>
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0 border-b bg-card">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="text-primary h-5 w-5" />
                        <DialogTitle className="text-xl font-bold">Registrar Nova Compra</DialogTitle>
                    </div>
                    <DialogDescription>Dê entrada de estoque e registre a despesa automaticamente.</DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto px-6">
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="purchase-supplier" className="text-xs font-bold uppercase text-muted-foreground">Fornecedor</Label>
                            <Select value={supplierId} onValueChange={setSupplierId} disabled={!!preselectedSupplier}>
                                <SelectTrigger id="purchase-supplier" className="h-12 bg-background border-2">
                                    <SelectValue placeholder="Selecione o fornecedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-muted/30 rounded-xl p-4 border border-dashed space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold uppercase tracking-tight">Itens da Compra</h4>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{purchaseItems.length} itens</span>
                            </div>
                            
                            <div className="space-y-3">
                                {purchaseItems.map((item, index) => {
                                    const suggestedPrice = (parseFloat(String(item.unitCost)) || 0) * 2.5;
                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start bg-background p-3 rounded-lg border shadow-sm relative group">
                                            <div className="col-span-12 sm:col-span-4 flex flex-col">
                                                <span className="font-bold text-sm leading-tight">{item.name}</span>
                                                {item.subcategory && <span className="text-[10px] text-muted-foreground uppercase">{item.subcategory}</span>}
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <Label htmlFor={`qty-${index}`} className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Qtd</Label>
                                                <Input name={`qty-${index}`} id={`qty-${index}`} type="number" placeholder="0" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="h-9 font-bold" />
                                            </div>
                                            <div className="col-span-8 sm:col-span-3">
                                                <Label htmlFor={`cost-${index}`} className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Custo Unitário</Label>
                                                <Input name={`cost-${index}`} id={`cost-${index}`} type="number" step="0.01" placeholder="0.00" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} className="h-9 font-bold" />
                                                {suggestedPrice > 0 && (
                                                    <div className="flex items-center text-[9px] text-yellow-500 mt-1 font-bold">
                                                        <Lightbulb size={10} className="mr-1" />
                                                        <span>Sug. Venda: R$ {suggestedPrice.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-10 sm:col-span-2 flex flex-col justify-center h-full pt-4 sm:pt-0">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase sm:text-right">Subtotal</span>
                                                <span className="text-sm font-black text-primary sm:text-right">R$ {((parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unitCost)) || 0)).toFixed(2)}</span>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                                               <Button onClick={() => handleRemoveItem(index)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 size={16} /></Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                 {purchaseItems.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50 italic">
                                        <ShoppingCart size={32} className="mb-2" />
                                        <p className="text-xs">Nenhum produto adicionado à lista.</p>
                                    </div>
                                 )}
                            </div>

                            <div className="relative pt-2">
                                <Label htmlFor="product-search" className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Adicionar Produto</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="product-search" 
                                        name="product-search" 
                                        type="text" 
                                        placeholder="Busque pelo nome do produto..." 
                                        value={productSearch} 
                                        onChange={e => setProductSearch(e.target.value)} 
                                        className="h-11 pl-10 border-2 border-primary/20 focus:border-primary"
                                    />
                                </div>
                                
                                {(availableProducts.length > 0 || (productSearch && productSearch.length >= 2)) && (
                                    <div className="absolute w-full z-20 max-h-60 overflow-y-auto bg-popover border-2 rounded-lg shadow-xl mt-1">
                                        {availableProducts.map(p => (
                                            <div key={p.id} onClick={() => handleAddProduct(p)} className="p-3 hover:bg-primary/10 cursor-pointer flex justify-between items-center border-b last:border-0">
                                              <span className="text-sm font-bold">{p.name} {p.subcategory && <span className="text-[10px] text-muted-foreground ml-1">({p.subcategory})</span>}</span>
                                              <PlusCircle size={16} className="text-primary" />
                                            </div>
                                        ))}
                                        {productSearch && (
                                            <div onClick={() => handleOpenNewProductModal(productSearch)} className="p-3 text-primary hover:bg-primary/10 cursor-pointer flex items-center font-bold text-sm">
                                                <PlusCircle size={18} className="mr-2"/> Criar novo produto: &quot;{productSearch}&quot;
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 border-t p-6 bg-card">
                    <div className="w-full flex flex-col gap-4">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Custo Total</span>
                            <span className="text-3xl font-black text-primary">R$ {totalCost.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSubmit} disabled={processing} className="h-12 flex-grow text-base font-black uppercase">
                                {processing ? <Spinner size="h-5 w-5" /> : 'Finalizar e Registrar'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-12 font-bold text-muted-foreground uppercase text-xs">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
            </Dialog>
            {isNewProductModalOpen && (
                <ProductFormModal 
                    allProducts={products}
                    open={isNewProductModalOpen}
                    onOpenChange={setIsNewProductModalOpen}
                    onSave={handleNewProductSaved}
                    product={initialProduct}
                />
            )}
        </TooltipProvider>
    );
};
