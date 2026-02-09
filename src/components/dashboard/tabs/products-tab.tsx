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

export const ProductsTab: React.FC = () => {
    const { products, suppliers, loading, saveProduct, deleteProduct, addStock } = useData();
    
    const [modalState, setModalState] = useState({ form: false, stock: false, delete: false });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const categories = useMemo(() => {
        if (!products) return []; 
        const uniqueCategories = new Set(products.map(p => p.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return []; 
        return products.filter(p => {
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            const matchesSearch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [products, categoryFilter, searchTerm]);

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
        
        if (stockValue <= 0 || threshold === null || typeof threshold === 'undefined' || threshold <= 0) {
            return false;
        }

        if(product.saleType === 'dose' && product.baseUnitSize && product.baseUnitSize > 0) {
            return stockValue < (product.baseUnitSize * threshold);
        }

        return stockValue <= threshold;
    };

    const calculateMarkup = (p: Product) => {
        const cost = Number(p.costPrice) || 0;
        let markupValue = 0;
        let hasCalculation = false;

        if (p.saleType === 'unit' && cost > 0) {
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
        }

        if (!hasCalculation) return { label: 'N/A', color: 'text-muted-foreground' };

        let color = 'text-accent';
        if (markupValue < 50) color = 'text-yellow-400';
        if (markupValue < 0) color = 'text-destructive';

        return { label: `${markupValue.toFixed(0)}%`, color };
    };

    const renderAccordionView = () => (
        <Accordion type="multiple" className="space-y-4" defaultValue={categories}>
            {Object.keys(groupedProducts).sort().map(category => (
                <AccordionItem key={category} value={category} className="bg-card rounded-xl border-b-0 shadow-sm">
                    <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                        {category}
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Produto</TableHead>
                                    <TableHead>Estoque</TableHead>
                                    <TableHead>Custo</TableHead>
                                    <TableHead>Preço Venda</TableHead>
                                    <TableHead>Markup</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedProducts[category].map(p => {
                                    const cost = Number(p.costPrice) || 0;
                                    const price = Number(p.unitPrice) || 0;
                                    const markup = calculateMarkup(p);

                                    return (
                                        <TableRow key={p.id} className="border-t">
                                            <TableCell className="font-medium pl-6">
                                                <div>{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.subcategory}</div>
                                            </TableCell>
                                            <TableCell>
                                                {p.saleType === 'service' ? (
                                                    'Não aplicável'
                                                ) : (p.stock ?? 0) <= 0 ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-destructive text-destructive-foreground">ESGOTADO</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span>{p.saleType === 'dose' ? `${p.stock} ml` : `${p.stock} un.`}</span>
                                                        {isProductLowOnStock(p) && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="bg-yellow-400 text-background text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                                        <AlertTriangle size={12} className="mr-1" /> ESTOQUE BAIXO
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Atingiu o mínimo de {p.lowStockThreshold} {p.saleType === 'dose' ? 'garrafas' : 'unidades'}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{p.saleType !== 'service' ? `R$ ${cost.toFixed(2)}` : 'N/A'}</TableCell>
                                            <TableCell>
                                                {p.saleType === 'unit' && `R$ ${price.toFixed(2)}`}
                                                {p.saleType === 'dose' && (p.doseOptions && p.doseOptions.length > 0 ? `${p.doseOptions.length} Opções` : 'N/A')}
                                                {p.saleType === 'service' && 'Valor Aberto'}
                                            </TableCell>
                                            <TableCell className={`font-bold ${markup.color}`}>
                                                {markup.label}
                                                {p.saleType === 'dose' && markup.label !== 'N/A' && (
                                                    <span className="text-[10px] block font-normal text-muted-foreground">(média)</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                {p.saleType !== 'service' && (
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="text-accent hover:text-accent/80"><PackagePlus size={20} /></Button></TooltipTrigger><TooltipContent><p>Adicionar Estoque</p></TooltipContent></Tooltip>
                                                )}
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-primary hover:text-primary/80"><Edit size={20} /></Button></TooltipTrigger><TooltipContent><p>Editar Produto</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleDeleteClick(p)} className="text-destructive hover:text-destructive/80"><Trash2 size={20} /></Button></TooltipTrigger><TooltipContent><p>Excluir Produto</p></TooltipContent></Tooltip>
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
    
    const renderContent = () => {
         if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;

         if (!products || products.length === 0) {
             return (
                <div className="text-center text-muted-foreground p-8 mt-10 bg-card rounded-lg">
                    <Package size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Nenhum Produto Cadastrado</h3>
                    <p className="max-w-sm mx-auto mt-2 mb-6">Comece adicionando produtos para gerenciar seu estoque e vendas.</p>
                    <Button onClick={handleAddNew}>Adicionar Primeiro Produto</Button>
                </div>
            );
         }
         
         if(Object.keys(groupedProducts).length === 0) {
             return (
                <div className="text-center text-muted-foreground p-8 mt-10 bg-card rounded-lg">
                    <Package size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Nenhum produto encontrado</h3>
                    <p className="max-w-sm mx-auto mt-2">Tente ajustar sua busca ou filtros.</p>
                </div>
            );
         }

         return renderAccordionView();
    };

    return (
        <TooltipProvider>
            <div className="p-1 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-3xl font-bold text-foreground flex items-center"><Package className="mr-3" /> Gerenciar Produtos</h2>
                     <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <Input 
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow bg-card"
                        />
                         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[180px] bg-card">
                                <SelectValue placeholder="Todas as Categorias" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80 w-full md:w-auto">
                            <PlusCircle className="mr-2" size={20} /> Novo Produto
                        </Button>
                    </div>
                </div>
                {renderContent()}

                {modalState.form && (
                    <ProductFormModal 
                        product={selectedProduct} 
                        allProducts={products || []} 
                        open={modalState.form} 
                        onOpenChange={closeAllModals} 
                        onSave={saveProduct}
                    />
                )}
                
                {modalState.stock && selectedProduct && (
                    <StockModal 
                        product={selectedProduct} 
                        open={modalState.stock} 
                        onOpenChange={closeAllModals} 
                        suppliers={suppliers} 
                        onAddStock={addStock}
                    />
                )}

                {productToDelete && (
                    <AlertDialog open={modalState.delete} onOpenChange={(isOpen) => !isOpen && closeAllModals()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto <strong>{productToDelete.name}</strong> e todos os seus dados.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={closeAllModals}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/80">
                                    Sim, excluir produto
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
};
