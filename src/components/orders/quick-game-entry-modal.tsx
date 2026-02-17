'use client';

import React, { useState, useEffect } from 'react';
import { Product, OrderItem } from '@/lib/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Zap, Hash, Dices, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductFormModal } from '@/components/products/product-form-modal';

/**
 * @fileOverview Modal de Entrada Rápida de Banca.
 * CTO: Permite registrar entradas e criar novas modalidades de jogo no mesmo fluxo.
 */

interface QuickGameEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gameModalities: Product[];
    allProducts: Product[];
    onSave: (order: { items: OrderItem[], total: number, displayName: string }, customerId: string | null, paymentMethod: string) => Promise<string>;
    onSaveProduct: (data: Omit<Product, 'id'>, id?: string) => Promise<string>;
}

export const QuickGameEntryModal: React.FC<QuickGameEntryModalProps> = ({ 
    open, 
    onOpenChange, 
    gameModalities, 
    allProducts,
    onSave, 
    onSaveProduct 
}) => {
    const { toast } = useToast();
    const [selectedGameId, setSelectedGameId] = useState('');
    const [amount, setAmount] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Estado para criação de nova modalidade dentro deste fluxo
    const [isNewModalityOpen, setIsNewModalityOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setSelectedGameId('');
            setAmount('');
            setIdentifier('');
            setProcessing(false);
        }
    }, [open]);

    const handleQuickSave = async () => {
        const game = gameModalities.find(g => g.id === selectedGameId);
        const numAmount = parseFloat(amount);

        if (!game || !numAmount || numAmount <= 0) {
            toast({ title: "Erro", description: "Selecione o jogo e informe um valor válido.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        try {
            const newItem: OrderItem = {
                productId: game.id!,
                name: game.name,
                quantity: 1,
                unitPrice: numAmount,
                identifier: identifier || undefined,
            };

            await onSave(
                { items: [newItem], total: numAmount, displayName: 'Banca (Entrada Rápida)' },
                null,
                'Dinheiro'
            );

            toast({ title: "Sucesso!", description: "Entrada registrada na Banca." });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleNewModalitySaved = async (data: Omit<Product, 'id'>, id?: string) => {
        const newId = await onSaveProduct(data, id);
        setSelectedGameId(newId);
        setIsNewModalityOpen(false);
        return newId;
    };

    return (
        <>
            <Dialog open={open && !isNewModalityOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-500 font-black uppercase tracking-tight">
                            <Zap size={20} fill="currentColor" /> Entrada Rápida de Banca
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">
                            Registro instantâneo para o caixa independente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Modalidade de Jogo</Label>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 text-[10px] font-black uppercase text-primary hover:text-primary/80"
                                    onClick={() => setIsNewModalityOpen(true)}
                                >
                                    <PlusCircle size={10} className="mr-1" /> Nova Modalidade
                                </Button>
                            </div>
                            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                                <SelectTrigger className="h-12 bg-background border-2 font-bold">
                                    <SelectValue placeholder="Selecione o jogo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {gameModalities.map(g => (
                                        <SelectItem key={g.id} value={g.id!} className="font-bold uppercase text-xs">
                                            <div className="flex items-center gap-2">
                                                <Dices size={12} className="text-orange-500" />
                                                {g.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {gameModalities.length === 0 && (
                                        <p className="p-4 text-center text-xs text-muted-foreground">Nenhuma modalidade cadastrada.</p>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor Arrecadado (R$)</Label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-12 text-xl font-black text-orange-500 bg-background border-2 focus:border-orange-500"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                                <Hash size={10} /> Referência (Opcional)
                            </Label>
                            <Input 
                                value={identifier} 
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="h-12 font-bold bg-background border-2"
                                placeholder="Ex: Milhar 1234, Maquina 05..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold uppercase text-xs h-12">Cancelar</Button>
                        <Button onClick={handleQuickSave} disabled={processing} className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-sm h-12 flex-1 shadow-lg">
                            {processing ? <Spinner size="h-4 w-4" /> : "Confirmar Entrada"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isNewModalityOpen && (
                <ProductFormModal 
                    product={{ saleType: 'game', category: 'Entretenimento' }}
                    allProducts={allProducts}
                    open={isNewModalityOpen}
                    onOpenChange={setIsNewModalityOpen}
                    onSave={handleNewModalitySaved}
                />
            )}
        </>
    );
};
