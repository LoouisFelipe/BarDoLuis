'use client';
import React, { useState, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Package, PlusCircle, Edit, PackagePlus, Trash2, AlertTriangle } from 'lucide-react';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { StockModal } from '@/components/products/stock-modal';
import { useData } from '@/contexts/data-context';
import { Product } from '@/lib/schemas';

/**
 * @fileOverview Gestão de Produtos do Bar.
 * CTO: UX aprimorada - Itens iniciam colapsados para melhor overview das categorias.
 */
export const ProductsTab: React.FC = () => {
    const { products, suppliers, loading, saveProduct, deleteProduct, addStock } = useData();
    
    const [modalState, setModalState] = useState({ form: false, stock: false, delete: false });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const barProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => p.saleType !== 'game');
    }, [products]);

    const categories = useMemo(() => {
        const uniqueCategories = new Set(barProducts.map(p => p.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [barProducts]);

    const filteredProducts = useMemo(() => {
        return barProducts.filter(p => {
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            const matchesSearch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [barProducts, categoryFilter, searchTerm]);

    const groupedProducts = useMemo(() => {
        return filteredProducts.reduce((acc, product) => {
            const category = product.category || 'Sem Categoria';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [filteredProducts]);

    const closeAllModals = () => {
        setModalState({ form: false, stock: false, delete: false });
        setSelectedProduct(null);
        setProductToDelete(null);
    };

    const handleAddNew = () => {
        setSelectedProduct(null);
        setModalState(prev => ({ ...prev, form: true }));
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setModalState(prev => ({ ...prev, form: true }));
    };

    const handleStock = (product: Product) => {
        setSelectedProduct(product);
        setModalState(prev => ({ ...prev, stock: true }));
    };

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setModalState(prev => ({ ...prev, delete: true }));
    };

    const confirmDelete = async () => {
        if (productToDelete && productToDelete.id) {
            await deleteProduct(productToDelete.id!);
            closeAllModals();
        }
    };
    
    const isProductLowOnStock = (product: Product): boolean => {
        const stockValue = product.stock ?? 0;
        const threshold = product.lowStockThreshold;
        if (stockValue <= 0 || threshold === null || typeof threshold === 'undefined' || threshold <= 0) return false;
        if(product.saleType === 'dose' && product.baseUnitSize && product.baseUnitSize > 0) return stockValue < (product.baseUnitSize * threshold);
        return stockValue <= threshold;
    };

    const calculateMarkup = (p: Product) => {
        const cost = Number(p.costPrice) || 0;
        let markupValue = 0;
        let hasCalculation = false;
        const isStandardSale = p.saleType === 'unit' || p.saleType === 'portion' || p.saleType === 'weight';
        if (isStandardSale && cost > 0) {
            const price = Number(p.unitPrice) || 0;
            markupValue = ((price - cost) / cost) * 100;
            hasCalculation = true;
        } else if (p.saleType === 'dose' && cost > 0 && p.baseUnitSize && p.baseUnitSize > 0) {
            const costPerMl = cost / p.baseUnitSize;
            const activeDoses = p.doseOptions?.filter(d => d.enabled && d.size > 0) || [];
            if (activeDoses.length > 0) {
                const totalMarkup = activeDoses.reduce((acc, dose) => {
                    const pricePerMl = dose.price / dose.size;
                    const doseMarkup = ((pricePerMl - costPerMl) / costPerMl) * 100;
                    return acc + doseMarkup;
                }, 0);
                markupValue = totalMarkup / activeDoses.length;
                hasCalculation = true;
            }
        } else if (p.saleType === 'service' && cost === 0 && (p.unitPrice || 0) > 0) return { label: 'MAX', color: 'text-accent' };
        if (!hasCalculation) return { label: 'N/A', color: 'text-muted-foreground' };
        let color = 'text-accent';
        if (markupValue < 50) color = 'text-yellow-400';
        if (markupValue < 0) color = 'text-destructive';
        return { label: `${markupValue.toFixed(0)}%`, color };
    };

    const renderAccordionView = () => (
        <Accordion type="multiple" className="space-y-4">
            {Object.keys(groupedProducts).sort().map(category => (
                <AccordionItem key={category} value={category} className="bg-card rounded-xl border-none shadow-sm overflow-hidden border-l-4 border-l-primary/40">
                    <AccordionTrigger className="px-6 text-lg font-black uppercase tracking-tight hover:no-underline hover:bg-muted/20 transition-all">
                        <div className="flex items-center gap-3">
                            <Package size={20} className="text-primary" />
                            {category}
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{groupedProducts[category].length}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pt-0 bg-background/40">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="pl-6 text-[10px] font-black uppercase">Produto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Estoque</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Preço</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Markup</TableHead>
                                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedProducts[category].map(p => {
                                    const cost = Number(p.costPrice) || 0;
                                    const price = Number(p.unitPrice) || 0;
                                    const markup = calculateMarkup(p);
                                    const stockLabel = p.saleType === 'dose' ? 'ml' : p.saleType === 'weight' ? 'kg' : 'un.';
                                    return (
                                        <TableRow key={p.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-bold text-sm pl-6">
                                                {p.name}
                                                <div className="text-[9px] text-muted-foreground uppercase">{p.subcategory}</div>
                                            </TableCell>
                                            <TableCell>
                                                {p.saleType === 'service' ? (
                                                    <span className="text-[9px] font-black uppercase opacity-30">N/A</span>
                                                ) : (p.stock ?? 0) <= 0 ? (
                                                    <Badge variant="destructive" className="text-[8px] font-black">ESGOTADO</Badge>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium">{p.stock} {stockLabel}</span>
                                                        {isProductLowOnStock(p) && <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold">
                                                {(p.saleType === 'unit' || p.saleType === 'portion' || p.saleType === 'weight') && `R$ ${price.toFixed(2)}`}
                                                {p.saleType === 'dose' && 'Doses'}
                                                {p.saleType === 'service' && 'Aberto'}
                                            </TableCell>
                                            <TableCell className={cn("text-xs font-black", markup.color)}>
                                                {markup.label}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-1">
                                                    {p.saleType !== 'service' && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="h-8 w-8 text-accent hover:bg-accent/10"><PackagePlus size={16} /></Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 text-primary hover:bg-primary/10"><Edit size={16} /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 size={16} /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
    
    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <h2 className="text-3xl font-black text-foreground flex items-center tracking-tighter uppercase">
                        <Package className="mr-3 text-primary" /> Gerenciar Bar
                    </h2>
                     <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <Input 
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-background h-11 border-2"
                        />
                         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[180px] bg-background h-11 border-2 font-bold uppercase text-[10px]">
                                <SelectValue placeholder="Todas Categorias" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">TODAS</SelectItem>
                                {categories.map(cat => <SelectItem key={cat} value={cat} className="uppercase text-[10px] font-bold">{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-black uppercase tracking-tight hover:bg-primary/80 w-full md:w-auto h-11 shadow-lg">
                            <PlusCircle className="mr-2" size={20} /> Novo Produto
                        </Button>
                    </div>
                </div>
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Spinner size="h-12 w-12" />
                        <p className="text-xs font-black uppercase text-muted-foreground animate-pulse tracking-widest">Sincronizando Inventário...</p>
                    </div>
                ) : barProducts.length === 0 ? (
                    <div className="text-center py-32 bg-muted/10 border-2 border-dashed rounded-3xl flex flex-col items-center gap-4">
                        <Package size={64} className="opacity-10" />
                        <p className="text-sm font-black uppercase text-muted-foreground">Nenhum produto cadastrado.</p>
                        <Button onClick={handleAddNew} variant="outline" className="font-bold h-12 uppercase">Adicionar Primeiro Item</Button>
                    </div>
                ) : (
                    renderAccordionView()
                )}

                {modalState.form && <ProductFormModal product={selectedProduct} allProducts={products || []} open={modalState.form} onOpenChange={closeAllModals} onSave={saveProduct} />}
                {modalState.stock && selectedProduct && <StockModal product={selectedProduct} open={modalState.stock} onOpenChange={closeAllModals} suppliers={suppliers} onAddStock={addStock} />}

                {productToDelete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent className="bg-card border-2">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-destructive uppercase tracking-tight">Excluir Produto?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed">
                                    Esta ação anulará permanentemente o registro de &quot;{productToDelete.name}&quot; e todo seu histórico de estoque.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="h-12 font-black uppercase text-[10px]">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90 h-12 font-black uppercase text-[10px] shadow-lg px-8">
                                    Sim, Excluir Produto
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};
