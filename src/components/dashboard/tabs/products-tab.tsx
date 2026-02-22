'use client';
import React, { useState, useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { Package, PlusCircle, Edit, PackagePlus, Trash2, Search, ChevronRight, X, LayoutGrid, List, AlertTriangle } from 'lucide-react';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { StockModal } from '@/components/products/stock-modal';
import { useData } from '@/contexts/data-context';
import { Product } from '@/lib/schemas';

export const ProductsTab: React.FC = () => {
    const { products, suppliers, loading, saveProduct, deleteProduct, addStock } = useData();
    
    const [modalState, setModalState] = useState({ form: false, stock: false, delete: false });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const barProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => p.saleType !== 'game');
    }, [products]);

    const lowStockCount = useMemo(() => {
        return barProducts.filter(p => p.saleType !== 'service' && p.stock <= (p.lowStockThreshold || 0)).length;
    }, [barProducts]);

    const categories = useMemo(() => {
        const uniqueCategories = new Set(barProducts.map(p => p.category.toUpperCase()));
        return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [barProducts]);

    const filteredProducts = useMemo(() => {
        return barProducts.filter(p => {
            const matchesCategory = !selectedCategory || p.category.toUpperCase() === selectedCategory.toUpperCase();
            const matchesSearch = searchTerm === '' || 
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
            const isLowStock = p.saleType !== 'service' && p.stock <= (p.lowStockThreshold || 0);
            const matchesLowStockFilter = !showLowStockOnly || isLowStock;
            
            return matchesCategory && matchesSearch && matchesLowStockFilter;
        }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [barProducts, selectedCategory, searchTerm, showLowStockOnly]);

    const closeAllModals = () => {
        setModalState({ form: false, stock: false, delete: false });
        setSelectedProduct(null);
        productToDelete && setProductToDelete(null);
    };

    const handleEdit = (product: Product) => { setSelectedProduct(product); setModalState(prev => ({ ...prev, form: true })); };
    const handleStock = (product: Product) => { setSelectedProduct(product); setModalState(prev => ({ ...prev, stock: true })); };
    const handleDeleteClick = (product: Product) => { setProductToDelete(product); setModalState(prev => ({ ...prev, delete: true })); };

    const confirmDelete = async () => {
        if (productToDelete && productToDelete.id) {
            await deleteProduct(productToDelete.id);
            closeAllModals();
        }
    };

    const renderGridView = () => {
        const gridCategories = categories.filter(cat => filteredProducts.some(p => p.category.toUpperCase() === cat));
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20 pr-1">
                {gridCategories.map(cat => (
                    <Card key={cat} className="aspect-square flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 bg-card border-2 shadow-sm relative group overflow-hidden" onClick={() => setSelectedCategory(cat)}>
                        <div className="p-4 bg-primary/10 rounded-2xl mb-3 group-hover:bg-primary/20"><Package size={32} className="text-primary" /></div>
                        <span className="font-black text-[10px] uppercase text-center px-2 tracking-widest text-foreground/90">{cat}</span>
                        <ChevronRight className="absolute right-2 bottom-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </Card>
                ))}
            </div>
        );
    };

    const renderListView = () => (
        <Accordion type="multiple" className="space-y-3 pb-20 pr-1">
            {categories.map(cat => {
                const itemsInCategory = filteredProducts.filter(p => p.category.toUpperCase() === cat);
                if (itemsInCategory.length === 0) return null;
                const subcategoriesMap = itemsInCategory.reduce((acc, p) => {
                    const sub = (p.subcategory || 'Diversos').toUpperCase();
                    if (!acc[sub]) acc[sub] = [];
                    acc[sub].push(p);
                    return acc;
                }, {} as Record<string, Product[]>);
                const sortedSubKeys = Object.keys(subcategoriesMap).sort((a, b) => a.localeCompare(b, 'pt-BR'));
                return (
                    <AccordionItem key={cat} value={cat} className="bg-card border rounded-2xl overflow-hidden shadow-sm px-0 border-b-0">
                        <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 h-16 group">
                            <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg text-primary"><Package size={18} /></div><span className="font-black uppercase text-xs tracking-widest">{cat}</span><Badge variant="secondary" className="ml-2 text-[9px] font-bold">{itemsInCategory.length}</Badge></div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t">
                            <Accordion type="multiple">
                                {sortedSubKeys.map(sub => (
                                    <AccordionItem key={sub} value={sub} className="border-b last:border-0 border-border/10">
                                        <AccordionTrigger className="bg-muted/30 px-6 py-2 border-b border-border/10 hover:no-underline">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">{sub}</p>
                                        </AccordionTrigger>
                                        <AccordionContent className="flex flex-col gap-1 p-2">
                                            {subcategoriesMap[sub].map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-4 bg-background/40 rounded-xl hover:bg-muted/20 transition-colors active:scale-[0.98]">
                                                    <div className="flex items-center gap-4 min-w-0 pr-2">
                                                        <div className={cn("p-2 rounded-lg shrink-0", (p.stock || 0) <= (p.lowStockThreshold || 0) ? "bg-red-500/10 text-red-500" : "bg-slate-900 text-slate-400")}><Package size={16} /></div>
                                                        <div className="min-w-0"><p className="font-bold text-sm truncate uppercase tracking-tight">{p.name}</p><p className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider truncate">{p.subcategory || 'Geral'}</p></div>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        <div className="text-right hidden xs:block"><p className="font-black text-xs text-foreground leading-none mb-1">R$ {Number(p.unitPrice || 0).toFixed(2)}</p><p className={cn("text-[9px] font-black leading-none uppercase", (p.stock || 0) <= (p.lowStockThreshold || 0) ? "text-red-500" : "text-emerald-500")}>{p.stock} {p.saleType === 'dose' ? 'ML' : 'UN.'}</p></div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="h-9 w-9 text-accent"><PackagePlus size={18} /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-9 w-9 text-primary"><Edit size={18} /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="h-9 w-9 text-destructive"><Trash2 size={18} /></Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border">
                    <div className="flex items-center gap-3 w-full md:max-w-2xl">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Filtrar produtos..." className="pl-11 h-12 bg-background border-none shadow-inner rounded-xl text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={loading} />
                        </div>
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl shrink-0 h-12">
                            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-10 w-10"><LayoutGrid size={18} /></Button>
                            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-10 w-10"><List size={18} /></Button>
                            <Button variant={showLowStockOnly ? 'destructive' : 'ghost'} size="icon" onClick={() => setShowLowStockOnly(!showLowStockOnly)} className={cn("h-10 w-10 relative", showLowStockOnly ? "bg-red-500/20 text-red-500" : "")}>
                                <AlertTriangle size={18} />
                                {lowStockCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white border-2 border-card">{lowStockCount}</span>}
                            </Button>
                        </div>
                    </div>
                    <Button onClick={() => setModalState(p => ({...p, form: true}))} className="w-full md:w-auto font-black gap-2 h-12 uppercase text-xs tracking-widest shadow-lg" disabled={loading}><PlusCircle className="h-5 w-5" /> Novo Produto</Button>
                </div>
                {loading ? <div className="flex justify-center py-20"><Spinner size="h-12 w-12" /></div> : (
                    <>
                        {(selectedCategory || searchTerm || showLowStockOnly) && (
                            <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-left-2">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setSearchTerm(''); setShowLowStockOnly(false); }} className="text-[9px] font-black uppercase text-primary gap-1 h-7 px-3 bg-primary/5 rounded-full"><X size={12} /> Limpar</Button>
                                {selectedCategory && <Badge className="h-7 rounded-full px-3 font-black uppercase tracking-widest text-[8px] bg-primary text-white border-none">{selectedCategory}</Badge>}
                                {showLowStockOnly && <Badge variant="destructive" className="text-[8px] font-black uppercase h-7 px-3 rounded-full flex items-center gap-1"><AlertTriangle size={10}/> Crítico</Badge>}
                            </div>
                        )}
                        {viewMode === 'grid' && !selectedCategory && !searchTerm ? renderGridView() : renderListView()}
                    </>
                )}
                {modalState.form && <ProductFormModal product={selectedProduct} allProducts={products || []} open={modalState.form} onOpenChange={closeAllModals} onSave={saveProduct} />}
                {modalState.stock && selectedProduct && <StockModal product={selectedProduct} open={modalState.stock} onOpenChange={closeAllModals} suppliers={suppliers} onAddStock={addStock} />}
                {productToDelete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent className="rounded-3xl p-8 border-border/40">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-destructive uppercase tracking-tight text-lg">Excluir Produto?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed mt-2">
                                    Apagar &quot;{productToDelete.name}&quot; permanentemente?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-6">
                                <AlertDialogCancel className="h-12 font-black uppercase text-[10px] rounded-xl">Não</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90 h-12 font-black uppercase text-[10px] rounded-xl">Sim, Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};