'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/schemas';

interface InventoryReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    products: Product[];
    onNavigateToProducts: () => void;
}

export const InventoryReportModal: React.FC<InventoryReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    products,
    onNavigateToProducts,
}) => {
    const lowStock = products.filter(p => p.saleType !== 'service' && p.stock <= (p.lowStockThreshold || 0)).sort((a, b) => a.stock - b.stock);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold">Relatório de Inventário</DialogTitle>
                    <DialogDescription>
                        Status do estoque, alertas de reposição e mix de produtos.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow px-6">
                    <div className="space-y-6 pb-10 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-l-4 border-l-destructive">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Produtos em Alerta</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-destructive">{lowStock.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Abaixo do limite de segurança.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Itens Cadastrados</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{reportData.totalProducts}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Produtos Necessitando Reposição</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6">Produto</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Estoque Atual</TableHead>
                                            <TableHead className="text-right pr-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStock.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="pl-6 font-medium">
                                                    <div>{p.name}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{p.subcategory}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{p.category}</TableCell>
                                                <TableCell className="font-bold">
                                                    {p.stock} {p.saleType === 'dose' ? 'ml' : 'un.'}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge variant={p.stock <= 0 ? "destructive" : "secondary"}>
                                                        {p.stock <= 0 ? "ESGOTADO" : "BAIXO"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {lowStock.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                                    Estoque saudável! Nenhum produto em alerta.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center">
                            <Button variant="outline" onClick={() => { onOpenChange(false); onNavigateToProducts(); }} className="gap-2">
                                Ir para Gestão de Produtos <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
