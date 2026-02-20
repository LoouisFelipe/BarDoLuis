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

import { Package, PlusCircle, Edit, PackagePlus, Trash2, Search, ChevronRight, X, LayoutGrid, List, Layers } from 'lucide-react';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { StockModal } from '@/components/products/stock-modal';
import { useData } from '@/contexts/data-context';
import { Product } from '@/lib/schemas';

/**
 * @fileOverview Gestão de Produtos com Navegação por Categoria e Subcategoria (Acordeão).
 * CTO: Implementação de drill-down tático para alta densidade de estoque.
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
            const matchesSearch = searchTerm === '' || 
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [barProducts, selectedCategory, searchTerm]);

    const productsBySubcategory = useMemo(() => {
        const groups: Record<string, Product[]> = {};
        filteredProducts.forEach(p => {
            const sub = p.subcategory || 'Geral';
            if (!groups[sub]) groups[sub] = [];
            groups[sub].push(p);
        });
        return groups;
    }, [filteredProducts]);

    const subcategories = useMemo(() => Object.keys(productsBySubcategory).sort(), [productsBySubcategory]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pb-20">
            {categories.map(cat => (
                <Card 
                    key={cat} 
                    className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all active:scale-95 bg-slate-900/40 border-2 border-slate-800 shadow-xl relative group overflow-hidden"
                    onClick={() => setSelectedCategory(cat)}
                >
                    <div className="p-6 bg-primary/10 rounded-3xl mb-5 group-hover:bg-primary/20 transition-all duration-300 shadow-2xl shadow-primary/5 group-hover:scale-110">
                        <Package size={48} className="text-primary" />
                    </div>
                    <span className="font-black text-xs uppercase text-center px-4 tracking-[0.25em] text-foreground/90">{cat}</span>
                    <ChevronRight className="absolute right-4 bottom-4 h-5 w-5 text-primary/30 group-hover:text-primary transition-colors" />
                </Card>
            ))}
        </div>
    );

    const renderProductsList = (items: Product[]) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/10">
                        <TableHead className="text-[9px] font-black uppercase">Produto</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Estoque</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Preço</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Markup</TableHead>
                        <TableHead className="text-right text-[9px] font-black uppercase">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(p => {
                        const markup = calculateMarkup(p);
                        const stockLabel = p.saleType === 'dose' ? 'ml' : p.saleType === 'weight' ? 'kg' : 'un.';
                        return (
                            <TableRow key={p.id} className="hover:bg-muted/10 border-b border-border/20">
                                <TableCell className="font-bold text-sm py-3">
                                    {p.name}
                                </TableCell>
                                <TableCell>
                                    <span className={cn("text-xs font-bold", (p.stock || 0) <= 0 ? "text-destructive" : "text-foreground")}>
                                        {p.stock} {stockLabel}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs font-bold">
                                    {(p.saleType === 'unit' || p.saleType === 'portion' || p.saleType === 'weight') && `R$ ${Number(p.unitPrice || 0).toFixed(2)}`}
                                    {p.saleType === 'dose' && 'Doses'}
                                    {p.saleType === 'service' && 'Aberto'}
                                </TableCell>
                                <TableCell className={cn("text-xs font-black", markup.color)}>
                                    {markup.label}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="h-8 w-8 text-accent"><PackagePlus size={16} /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 text-primary"><Edit size={16} /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="h-8 w-8 text-destructive"><Trash2 size={16} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );

    const renderProductsGrid = (items: Product[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {items.map(p => {
                const markup = calculateMarkup(p);
                return (
                    <Card key={p.id} className="bg-muted/20 border-border/40 overflow-hidden group">
                        <CardHeader className="p-3 pb-1">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xs font-bold truncate">{p.name}</CardTitle>
                                <span className={cn("text-[10px] font-black", markup.color)}>{markup.label}</span>
                            </div>
                        </CardHeader>
                        <CardFooter className="p-2 pt-0 flex justify-between items-center bg-muted/10">
                            <div className="text-[10px] font-bold opacity-60">{p.stock} {p.saleType === 'dose' ? 'ml' : 'un.'}</div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="h-7 w-7"><PackagePlus size={12} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-7 w-7"><Edit size={12} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="h-7 w-7 text-destructive"><Trash2 size={12} /></Button>
                            </div>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );

    const renderSubcategoryAccordion = () => (
        <Accordion type="multiple" className="space-y-3 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between bg-card p-3 rounded-xl border-2 mb-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                    className="text-[10px] font-black uppercase text-primary gap-1"
                >
                    <X size={12} /> Voltar para Categorias
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-7 w-7"><List size={14} /></Button>
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-7 w-7"><LayoutGrid size={14} /></Button>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-3 py-1 rounded-full">{selectedCategory}</span>
                </div>
            </div>

            {subcategories.map(sub => (
                <AccordionItem key={sub} value={sub} className="bg-card rounded-xl border-none shadow-sm overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all border-l-4 border-l-primary">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Layers size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm uppercase tracking-tight">{sub}</p>
                                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                                    {productsBySubcategory[sub].length} itens encontrados
                                </p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 border-t border-border/20">
                        {viewMode === 'list' ? renderProductsList(productsBySubcategory[sub]) : renderProductsGrid(productsBySubcategory[sub])}
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
                    (!selectedCategory && !searchTerm) ? renderGridView() : renderSubcategoryAccordion()
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
