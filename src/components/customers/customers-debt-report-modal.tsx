'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, ArrowRight } from 'lucide-react';
import { Customer } from '@/lib/schemas';

interface CustomersDebtReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: any;
    customers: Customer[];
    onNavigateToCustomers: () => void;
}

export const CustomersDebtReportModal: React.FC<CustomersDebtReportModalProps> = ({
    open,
    onOpenChange,
    reportData,
    customers,
    onNavigateToCustomers,
}) => {
    const debtors = customers.filter(c => (c.balance || 0) > 0).sort((a, b) => (b.balance || 0) - (a.balance || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold">Relatório de Inadimplência</DialogTitle>
                    <DialogDescription>
                        Lista de clientes com saldo devedor (Fiado).
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow px-6">
                    <div className="space-y-6 pb-10 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-l-4 border-l-yellow-400">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
                                    <DollarSign className="h-4 w-4 text-yellow-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-yellow-400">R$ {reportData.totalCustomerDebt.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Nº de Devedores</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{reportData.customersWithDebt}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Detalhamento por Cliente</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6">Cliente</TableHead>
                                            <TableHead>Contato</TableHead>
                                            <TableHead className="text-right pr-6">Saldo Devedor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {debtors.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{c.contact || 'N/A'}</TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-yellow-400">R$ {(c.balance || 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {debtors.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                                    Nenhum cliente com dívida ativa.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center">
                            <Button variant="outline" onClick={() => { onOpenChange(false); onNavigateToCustomers(); }} className="gap-2">
                                Ir para Gestão de Clientes <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
