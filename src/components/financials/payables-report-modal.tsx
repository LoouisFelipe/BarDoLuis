
'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, History, AlertCircle, TrendingDown, LayoutList, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface PayablesReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transactions: Transaction[];
    onMarkAsPaid: (id: string) => Promise<void>;
    onEdit?: (transaction: Transaction) => void;
}

/**
 * @fileOverview Relatório de Contas a Pagar Global.
 * CTO: Auditoria de passivos sem trava temporal para segurança financeira.
 * CEO: Agora com ação de editar para correções de última hora.
 */
export const PayablesReportModal: React.FC<PayablesReportModalProps> = ({
    open,
    onOpenChange,
    transactions,
    onMarkAsPaid,
    onEdit
}) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const pendingExpenses = useMemo(() => {
        return (transactions || [])
            .filter(t => t.type === 'expense' && t.status === 'pending')
            .sort((a, b) => {
                const dateA = a.timestamp instanceof Date ? a.timestamp : (a.timestamp as any)?.toDate?.() || new Date();
                const dateB = b.timestamp instanceof Date ? b.timestamp : (b.timestamp as any)?.toDate?.() || new Date();
                return dateA.getTime() - dateB.getTime(); // Ordem cronológica (mais antigas primeiro)
            });
    }, [transactions]);

    const totalPayable = useMemo(() => 
        pendingExpenses.reduce((sum, t) => sum + (t.total || 0), 0), 
    [pendingExpenses]);

    const handleLiquidar = async (id: string) => {
        setProcessingId(id);
        try {
            await onMarkAsPaid(id);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 border-b bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                            <Clock size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Contas a Pagar (Passivo Global)</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mt-1">
                                Tudo que o BarDoLuis deve liquidar.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div className="p-6 space-y-6 pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-l-4 border-l-orange-500 bg-orange-500/5">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Total Pendente</CardTitle>
                                        <TrendingDown className="h-4 w-4 text-orange-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-orange-400">R$ {totalPayable.toFixed(2)}</div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Soma de todos os boletos e vales em aberto.</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-l-primary bg-primary/5">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Nº de Compromissos</CardTitle>
                                        <LayoutList className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-primary">{pendingExpenses.length} Notas</div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Quantidade de registros aguardando baixa.</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-none shadow-lg">
                                <CardHeader className="border-b bg-muted/10 py-4">
                                    <div className="flex items-center gap-2">
                                        <History size={16} className="text-primary" />
                                        <CardTitle className="text-xs font-black uppercase tracking-widest">Cronograma de Pagamentos</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30 border-b-2">
                                                    <TableHead className="text-[9px] font-black uppercase px-6">Data Ref.</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase px-6">Descrição</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase px-6">Categoria</TableHead>
                                                    <TableHead className="text-right text-[9px] font-black uppercase px-6">Valor</TableHead>
                                                    <TableHead className="w-[120px] text-center text-[9px] font-black uppercase px-6">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingExpenses.length > 0 ? (
                                                    pendingExpenses.map((t) => {
                                                        const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any)?.toDate?.() || new Date();
                                                        return (
                                                            <TableRow key={t.id} className="hover:bg-orange-500/[0.02] border-b border-border/50">
                                                                <TableCell className="text-[10px] font-bold px-6 whitespace-nowrap opacity-60">
                                                                    {format(date, 'dd/MM/yyyy')}
                                                                </TableCell>
                                                                <TableCell className="px-6">
                                                                    <p className="text-[11px] font-black uppercase truncate max-w-[200px]">{t.description}</p>
                                                                </TableCell>
                                                                <TableCell className="px-6">
                                                                    <Badge variant="outline" className="text-[8px] font-black uppercase bg-muted/20 border-border/40">
                                                                        {t.expenseCategory || 'Geral'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right px-6 font-black text-orange-400 text-sm">
                                                                    R$ {t.total.toFixed(2)}
                                                                </TableCell>
                                                                <TableCell className="text-center px-6">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                                                            onClick={() => {
                                                                                if (onEdit) onEdit(t);
                                                                            }}
                                                                        >
                                                                            <Edit size={16} />
                                                                        </Button>
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                                                                            onClick={() => handleLiquidar(t.id!)}
                                                                            disabled={processingId === t.id}
                                                                        >
                                                                            {processingId === t.id ? <Spinner size="h-4 w-4" /> : <CheckCircle2 size={18} />}
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-24">
                                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                                <CheckCircle2 size={48} className="text-emerald-500" />
                                                                <p className="text-xs font-black uppercase tracking-[0.2em]">Parabéns, CEO! Nenhuma conta a pagar.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex gap-4 items-start">
                                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                                    <AlertCircle size={18} className="text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Nota da Controladoria</p>
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                        Os valores aqui listados representam o passivo total do sistema. Eles só serão subtraídos do seu Lucro Líquido no momento da liquidação (clique no ícone de check).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
