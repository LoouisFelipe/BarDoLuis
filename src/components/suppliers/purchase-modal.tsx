
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lightbulb, PlusCircle, Trash2 } from 'lucide-react';
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
        if (!productSearch) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(productSearch.toLowerCase()) && 
            !purchaseItems.some(item => item.productId === p.id)
        );
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
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Registrar Nova Compra</DialogTitle>
                    <DialogDescription>Selecione um fornecedor e adicione itens para registrar a entrada de estoque e despesas.</DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="purchase-supplier">Fornecedor</Label>
                            <Select value={supplierId} onValueChange={setSupplierId} disabled={!!preselectedSupplier}>
                                <SelectTrigger id="purchase-supplier" name="supplier">
                                    <SelectValue placeholder="Selecione um fornecedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-secondary p-4 rounded-lg space-y-4">
                            <h4 className="font-semibold">Itens da Compra</h4>
                            <div className="space-y-3">
                                {purchaseItems.map((item, index) => {
                                    const suggestedPrice = (parseFloat(String(item.unitCost)) || 0) * 2.5;
                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-x-3 gap-y-2 items-center bg-background p-3 rounded-md">
                                            <span className="col-span-12 sm:col-span-4 font-medium">{item.name}{item.subcategory ? ` (${item.subcategory})` : ''}</span>
                                            <div className="col-span-4 sm:col-span-2">
                                                <Label htmlFor={`qty-${index}`} className="sr-only">Quantidade</Label>
                                                <Input name={`qty-${index}`} id={`qty-${index}`} type="number" placeholder="Qtd" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="text-base" />
                                            </div>
                                            <div className="col-span-8 sm:col-span-3">
                                                <Label htmlFor={`cost-${index}`} className="sr-only">Custo por Unidade</Label>
                                                <Input name={`cost-${index}`} id={`cost-${index}`} type="number" step="0.01" placeholder="Custo/Un" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} className="text-base" />
                                                {suggestedPrice > 0 && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center text-xs text-yellow-400 mt-1 cursor-help"><Lightbulb size={14} className="mr-1" /><span>Sug. Venda: R$ {suggestedPrice.toFixed(2)}</span></div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Baseado em um markup de 150% (custo x 2.5). Edite o preço de venda no cadastro do produto.</p></TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <span className="col-span-8 sm:col-span-2 text-left sm:text-right font-semibold">R$ {((parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unitCost)) || 0)).toFixed(2)}</span>
                                            <div className="col-span-4 sm:col-span-1 flex justify-end">
                                               <Button onClick={() => handleRemoveItem(index)} variant="ghost" size="icon" className="text-destructive hover:text-red-300"><Trash2 size={18} /></Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                 {purchaseItems.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum item adicionado.</p>}
                            </div>
                            <div className="relative">
                                <Label htmlFor="product-search" className="sr-only">Buscar produto</Label>
                                <Input id="product-search" name="product-search" type="text" placeholder="Buscar produto para adicionar..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                                {availableProducts.length > 0 && (
                                    <div className="absolute w-full z-20 max-h-40 overflow-y-auto bg-popover border rounded-md shadow-lg bottom-12">
                                        {availableProducts.map(p => (
                                            <div key={p.id} onClick={() => handleAddProduct(p)} className="p-2 hover:bg-primary/20 cursor-pointer">
                                              {p.name} {p.subcategory && `(${p.subcategory})`}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {productSearch && !availableProducts.some(p => p.name.toLowerCase() === productSearch.toLowerCase()) && (
                                    <div className="absolute w-full z-20 bg-popover border rounded-md shadow-lg bottom-12">
                                        <div onClick={() => handleOpenNewProductModal(productSearch)} className="p-2 text-primary hover:bg-primary/20 cursor-pointer flex items-center">
                                            <PlusCircle size={16} className="mr-2"/> Criar novo produto: &quot;{productSearch}&quot;
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4 -mx-6 px-6 bg-background">
                    <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                            Custo Total: R$ {totalCost.toFixed(2)}
                        </span>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={processing} className="w-full sm:w-auto">
                                {processing ? <Spinner /> : 'Finalizar e Registrar Compra'}
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
                    onSave={onSaveProduct}
                    product={initialProduct}
                />
            )}
        </TooltipProvider>
    );
};
