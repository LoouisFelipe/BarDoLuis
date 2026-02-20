
'use client';
import React, { useState, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { Package, PlusCircle, Edit, PackagePlus, Trash2, Search, ChevronRight, X, LayoutGrid, List, Layers, ShoppingBasket } from 'lucide-react';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { StockModal } from '@/components/products/stock-modal';
import { useData } from '@/contexts/data-context';
import { Product } from '@/lib/schemas';

/**
 * @fileOverview Gestão de Produtos com Visualização Flexível (Lista/Cards).
 * CTO: Implementação do modo drill-down tático e header unificado.
 */
export const ProductsTab: React.FC = () => {
    const { products, suppliers, loading, saveProduct, deleteProduct, addStock } = useData();
    
    const [modalState, setModalState] = useState({ form: false, stock: false, delete: false });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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
            const matchesSearch = searchTerm === '' || 
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
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

    const renderGridView = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
            {categories.map(cat => (
                <Card 
                    key={cat} 
                    className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all bg-card border-2 shadow-sm relative group overflow-hidden"
                    onClick={() => setSelectedCategory(cat)}
                >
                    <div className="p-4 bg-primary/10 rounded-2xl mb-3 group-hover:bg-primary/20 transition-all duration-300">
                        <Package size={32} className="text-primary" />
                    </div>
                    <span className="font-black text-[10px] uppercase text-center px-2 tracking-widest text-foreground/90">{cat}</span>
                    <ChevronRight className="absolute right-2 bottom-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
            ))}
        </div>
    );

    const renderListView = (items: Product[]) => (
        <div className="space-y-2 pb-20">
            {items.map(p => (
                <Card 
                    key={p.id} 
                    className="bg-card hover:bg-muted/50 transition-all border-l-4 border-l-transparent hover:border-l-primary"
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-base">{p.name}</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                    {p.category} {p.subcategory ? `• ${p.subcategory}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Preço</p>
                                <p className="text-sm font-black">R$ {Number(p.unitPrice || 0).toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Estoque</p>
                                <p className={cn("text-sm font-black", (p.stock || 0) <= (p.lowStockThreshold || 0) ? "text-red-500" : "text-emerald-500")}>
                                    {p.stock} {p.saleType === 'dose' ? 'ml' : 'un.'}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="h-9 w-9 text-accent"><PackagePlus size={18} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-9 w-9 text-primary"><Edit size={18} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="h-9 w-9 text-destructive"><Trash2 size={18} /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-4 w-full md:max-w-2xl">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar produto..." 
                                className="pl-10 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg shrink-0">
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('grid')}
                                className="h-9 w-9"
                            >
                                <LayoutGrid size={18} />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('list')}
                                className="h-9 w-9"
                            >
                                <List size={18} />
                            </Button>
                        </div>
                    </div>
                    <Button onClick={handleAddNew} className="w-full md:w-auto font-bold gap-2 h-11" disabled={loading}>
                        <PlusCircle className="h-5 w-5" />
                        Novo Produto
                    </Button>
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
                    <>
                        {selectedCategory && (
                            <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-left-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-[10px] font-black uppercase text-primary gap-1"
                                >
                                    <X size={12} /> Voltar
                                </Button>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-3 py-1 rounded-full">{selectedCategory}</span>
                            </div>
                        )}

                        {viewMode === 'grid' && !selectedCategory && !searchTerm ? (
                            renderGridView()
                        ) : (
                            renderListView(filteredProducts)
                        )}
                    </>
                )}

                {modalState.form && <ProductFormModal product={selectedProduct} allProducts={products || []} open={modalState.form} onOpenChange={closeAllModals} onSave={saveProduct} />}
                {modalState.stock && selectedProduct && <StockModal product={selectedProduct} open={modalState.stock} onOpenChange={closeAllModals} suppliers={suppliers} onAddStock={addStock} />}

                {productToDelete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-destructive uppercase tracking-tight">Excluir Produto?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed">
                                    Esta ação anulará permanentemente o registro de &quot;{productToDelete.name}&quot;.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90 font-black uppercase text-[10px]">
                                    Sim, Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};
