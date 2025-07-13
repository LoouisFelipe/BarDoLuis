'use client';
import React, { useState } from 'react';

import { ProductFormModal } from './modals/product-form-modal';
import { StockModal } from './modals/stock-modal';
import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Package, PlusCircle, Edit, AlertTriangle } from 'lucide-react';

export const TabProdutos = ({ products, loading, userId, allProducts, suppliers, showNotification }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isStockModalOpen, setStockModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForStock, setProductForStock] = useState(null);

    const handleEdit = (product) => { setEditingProduct(product); setModalOpen(true); };
    const handleAddNew = () => { setEditingProduct(null); setModalOpen(true); };
    const handleStock = (product) => { setProductForStock(product); setStockModalOpen(true); };

    const isLowStock = (product) => {
        if (product.saleType === 'combo' || !product.stock) return false;
        const threshold = product.saleType === 'unit' ? 10 : (product.baseUnitSize || 1000) * 2; // Ex: 2 garrafas
        return product.stock > 0 && product.stock < threshold;
    };

    return (
        <TooltipProvider>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-foreground flex items-center"><Package className="mr-3" /> Gerenciar Produtos</h2>
                    <Button onClick={handleAddNew} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80"><PlusCircle className="mr-2" size={20} /> Novo Produto</Button>
                </div>
                {loading ? <div className="flex justify-center"><Spinner /></div> : (
                    <div className="bg-card rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Estoque</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.name} {p.subcategoria && <span className="text-xs text-muted-foreground">({p.subcategoria})</span>}</TableCell>
                                            <TableCell>{p.categoria || 'N/A'}</TableCell>
                                            <TableCell>
                                                {p.saleType !== 'combo' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>{p.stock} {p.baseUnit}</span>
                                                        {isLowStock(p) && 
                                                        <Tooltip>
                                                            <TooltipTrigger asChild><span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center"><AlertTriangle size={12} className="mr-1"/> BAIXO</span></TooltipTrigger>
                                                            <TooltipContent><p>Este item está acabando!</p></TooltipContent>
                                                        </Tooltip>
                                                        }
                                                        {p.stock <= 0 && <span className="text-xs font-bold px-2 py-1 rounded-full bg-destructive text-destructive-foreground">ESGOTADO</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic text-purple-400">N/A (Combo)</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    {p.saleType !== 'combo' && 
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleStock(p)} className="text-green-400 hover:text-green-300"><PlusCircle size={20} /></Button></TooltipTrigger>
                                                        <TooltipContent><p>Adicionar Estoque</p></TooltipContent>
                                                    </Tooltip>
                                                    }
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-blue-400 hover:text-blue-300"><Edit size={20} /></Button></TooltipTrigger>
                                                        <TooltipContent><p>Editar Produto</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
                {isModalOpen && <ProductFormModal product={editingProduct} open={isModalOpen} onOpenChange={setModalOpen} userId={userId} allProducts={allProducts} showNotification={showNotification}/>}
                {isStockModalOpen && <StockModal product={productForStock} open={isStockModalOpen} onOpenChange={setStockModalOpen} userId={userId} suppliers={suppliers} showNotification={showNotification}/>}
            </div>
        </TooltipProvider>
    );
};
