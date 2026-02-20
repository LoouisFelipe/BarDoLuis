'use client';
import React, { useState, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { Package, PlusCircle, Edit, PackagePlus, Trash2, Search, ChevronRight, X, LayoutGrid, List } from 'lucide-react';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { StockModal } from '@/components/products/stock-modal';
import { useData } from '@/contexts/data-context';
import { Product } from '@/lib/schemas';

/**
 * @fileOverview Gestão de Produtos com Opções de Lista/Cards e Navegação por Categorias.
 * CTO: Estabilização de utilitários e implementação do ViewMode Toggle.
 */
export const ProductsTab: React.FC = () => {
    const { products, suppliers, loading, saveProduct, deleteProduct, addStock } = useData();
    
    const [modalState, setModalState] = useState({ form: false, stock: false, delete: false });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
            const matchesCategory = !selectedCategory || p.category === selectedCategory;
            const matchesSearch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [barProducts, selectedCategory, searchTerm]);

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

    const renderGridView = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-20">
            {categories.map(cat => (
                <Card 
                    key={cat} 
                    className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all active:scale-95 bg-card/40 border-2 shadow-sm relative group overflow-hidden"
                    onClick={() => setSelectedCategory(cat)}
                >
                    <div className="p-4 bg-primary/10 rounded-2xl mb-3 group-hover:bg-primary/20 transition-colors">
                        <Package size={32} className="text-primary" />
                    </div>
                    <span className="font-black text-xs uppercase text-center px-2 tracking-widest">{cat}</span>
                    <ChevronRight className="absolute right-2 bottom-2 h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                </Card>
            ))}
        </div>
    );

    const renderTableView = () => (
        <div className="bg-card rounded-xl shadow-lg border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                    className="text-[10px] font-black uppercase text-primary gap-1"
                >
                    <X size={12} /> Voltar para Categorias
                </Button>
                {selectedCategory && <Badge className="font-black uppercase tracking-widest text-[9px]">{selectedCategory}</Badge>}
            </div>
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
                    {filteredProducts.map(p => {
                        const markup = calculateMarkup(p);
                        const stockLabel = p.saleType === 'dose' ? 'ml' : p.saleType === 'weight' ? 'kg' : 'un.';
                        return (
                            <TableRow key={p.id} className="hover:bg-muted/10 transition-colors border-b border-border/50">
                                <TableCell className="font-bold text-sm pl-6 py-4">
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
                                    {(p.saleType === 'unit' || p.saleType === 'portion' || p.saleType === 'weight') && `R$ ${Number(p.unitPrice || 0).toFixed(2)}`}
                                    {p.saleType === 'dose' && 'Várias Doses'}
                                    {p.saleType === 'service' && 'Valor Aberto'}
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
        </div>
    );

    const renderCardItemsView = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between rounded-xl border-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                    className="text-[10px] font-black uppercase text-primary gap-1"
                >
                    <X size={12} /> Voltar para Categorias
                </Button>
                {selectedCategory && <Badge className="font-black uppercase tracking-widest text-[9px]">{selectedCategory}</Badge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {filteredProducts.map(p => {
                    const markup = calculateMarkup(p);
                    const stockLabel = p.saleType === 'dose' ? 'ml' : p.saleType === 'weight' ? 'kg' : 'un.';
                    return (
                        <Card key={p.id} className="bg-card border-2 hover:border-primary/20 transition-all overflow-hidden group">
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <CardTitle className="text-sm font-bold truncate">{p.name}</CardTitle>
                                        <CardDescription className="text-[9px] uppercase font-bold text-muted-foreground">{p.subcategory || 'Geral'}</CardDescription>
                                    </div>
                                    <Badge variant={isProductLowOnStock(p) ? 'destructive' : 'outline'} className="text-[8px] font-black">
                                        {p.stock} {stockLabel}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex justify-between items-end mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Preço</span>
                                        <span className="text-base font-black text-foreground">
                                            {(p.saleType === 'unit' || p.saleType === 'portion' || p.saleType === 'weight') ? `R$ ${Number(p.unitPrice || 0).toFixed(2)}` : p.saleType === 'dose' ? 'Doses' : 'Aberto'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest block">Markup</span>
                                        <span className={cn("text-sm font-black", markup.color)}>{markup.label}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-2 bg-muted/20 flex justify-end gap-1">
                                {p.saleType !== 'service' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="h-9 w-9 text-accent hover:bg-accent/10"><PackagePlus size={18} /></Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-9 w-9 text-primary hover:bg-primary/10"><Edit size={18} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 size={18} /></Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
    
    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <h2 className="text-3xl font-black text-foreground flex items-center tracking-tighter uppercase">
                        <Package className="mr-3 text-primary" /> Gerenciar Bar
                    </h2>
                     <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-background h-11 pl-10 border-2"
                            />
                        </div>
                        <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-black uppercase tracking-tight hover:bg-primary/80 w-full md:w-auto h-11 shadow-lg">
                            <PlusCircle className="mr-2" size={20} /> Novo Produto
                        </Button>
                    </div>
                </div>

                {(selectedCategory || searchTerm) && (
                    <div className="flex justify-end pr-2">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('list')}
                                className="h-8 w-8"
                            >
                                <List size={16} />
                            </Button>
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('grid')}
                                className="h-8 w-8"
                            >
                                <LayoutGrid size={16} />
                            </Button>
                        </div>
                    </div>
                )}
                
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
                    (!selectedCategory && !searchTerm) ? renderGridView() : (viewMode === 'list' ? renderTableView() : renderCardItemsView())
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