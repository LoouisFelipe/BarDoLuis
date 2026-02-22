'use client';

import { Order, OrderItem, Customer, GameModality } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { User, CheckCircle2, TicketPercent, Calendar as CalendarIcon, Trophy, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

interface OrderPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    displayName: string;
    items: OrderItem[];
    total: number;
    customerId: string | null;
    createdAt?: any;
  };
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCloseAll: () => void;
}

/**
 * @fileOverview Modal de Pagamento Adaptativo.
 * CTO: Implementação de inteligência de crédito para totais negativos.
 */
export const OrderPaymentModal: React.FC<OrderPaymentModalProps> = ({
  open,
  onOpenChange,
  order,
  onDeleteOrder,
  onCloseAll,
}) => {
  const { gameModalities, customers, finalizeOrder } = useData();
  const { isAdmin, isCaixaOrAdmin } = useAuth();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(order.customerId);
  const [discount, setDiscount] = useState<number>(0);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const [processing, setProcessing] = useState(false);

  // Estados para Prêmio de Jogo
  const [gamePayoutId, setGamePayoutId] = useState<string>('none');
  const [gamePayoutAmount, setGamePayoutAmount] = useState<number>(0);

  useEffect(() => {
    if (order.customerId) {
        setSelectedCustomerId(order.customerId);
    }
  }, [order.customerId]);

  const finalTotal = useMemo(() => 
    order.total - discount - gamePayoutAmount, 
    [order.total, discount, gamePayoutAmount]
  );

  const isGeneratingCredit = finalTotal < 0;

  const handleFinalize = async () => {
    if (paymentMethod === 'Fiado' && !selectedCustomerId) {
      toast({
        title: 'Cliente não selecionado',
        description: 'Por favor, selecione um cliente para vendas a prazo (fiado).',
        variant: 'destructive',
      });
      return;
    }

    if (isGeneratingCredit && !selectedCustomerId) {
        toast({
            title: 'Atenção ao Crédito',
            description: 'Para gerar crédito, você deve vincular esta comanda a um cliente fiel.',
            variant: 'destructive',
        });
        return;
    }

    setProcessing(true);
    try {
      const currentCustomer = customers.find(c => c.id === selectedCustomerId);
      const finalDisplayName = currentCustomer ? currentCustomer.name : order.displayName;
      const selectedGame = gameModalities.find(g => g.id === gamePayoutId);

      await finalizeOrder(
        { items: order.items, total: finalTotal, displayName: finalDisplayName, createdAt: order.createdAt },
        selectedCustomerId,
        paymentMethod,
        discount,
        saleDate,
        gamePayoutId !== 'none' && gamePayoutAmount > 0 ? {
          productId: gamePayoutId,
          name: selectedGame?.name || 'Jogo',
          amount: gamePayoutAmount
        } : undefined
      );

      await onDeleteOrder(order.id);
      onCloseAll();

    } catch (error: any) {
      console.error('Failed to finalize order:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isGeneratingCredit ? <Wallet className="text-accent" /> : <CheckCircle2 className="text-primary" />}
            Finalizar: {order.displayName}
          </DialogTitle>
          <DialogDescription>
            {isGeneratingCredit 
                ? "Esta comanda resultará em CRÉDITO para o fiel selecionado." 
                : "Confirme o meio de pagamento e abatimentos."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className={cn(
              "flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed relative transition-all",
              isGeneratingCredit 
                ? "bg-accent/5 border-accent/40 shadow-[0_0_20px_rgba(20,184,166,0.1)]" 
                : "bg-muted/30 border-primary/20"
          )}>
             <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                {discount > 0 && <span className="text-[9px] bg-destructive text-white px-2 py-0.5 rounded-full font-black uppercase">Desc: -{discount.toFixed(2)}</span>}
                {gamePayoutAmount > 0 && <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Prêmio: -{gamePayoutAmount.toFixed(2)}</span>}
             </div>
             
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                {isGeneratingCredit ? 'VALOR DO CRÉDITO' : 'TOTAL A RECEBER'}
             </p>
             
             <p className={cn(
                 "text-5xl font-black tracking-tighter",
                 isGeneratingCredit ? "text-accent" : "text-primary"
             )}>
                R$ {Math.abs(finalTotal).toFixed(2)}
             </p>
             
             {isGeneratingCredit && (
                 <Badge variant="outline" className="mt-4 border-accent text-accent font-black uppercase text-[10px] tracking-widest bg-accent/10">
                    Gerando Adiantamento
                 </Badge>
             )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest"><CalendarIcon size={14} /> Data do Atendimento</Label>
              <DatePicker date={saleDate} setDate={setSaleDate} className="w-full" />
            </div>

            {isCaixaOrAdmin && (
              <div className="space-y-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1"><Trophy size={14} className="text-orange-500" /><Label className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Pagar com Prêmio de Jogo</Label></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={gamePayoutId} onValueChange={setGamePayoutId}>
                    <SelectTrigger className="h-10 bg-background border-orange-500/30 text-xs font-bold uppercase"><SelectValue placeholder="Jogo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Sem Prêmio --</SelectItem>
                      {gameModalities.map(g => <SelectItem key={g.id} value={g.id!} className="text-xs font-bold uppercase">{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Valor R$" 
                    value={gamePayoutAmount || ''} 
                    onChange={(e) => setGamePayoutAmount(parseFloat(e.target.value) || 0)} 
                    className="h-10 bg-background border-orange-500/30 font-black text-orange-500" 
                    disabled={gamePayoutId === 'none'} 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Vincular Fiel {isGeneratingCredit && <span className="text-accent">* OBRIGATÓRIO PARA CRÉDITO</span>}</Label>
              <Select value={selectedCustomerId || 'avulso'} onValueChange={(v) => setSelectedCustomerId(v === 'avulso' ? null : v)}>
                <SelectTrigger className={cn("h-12 bg-background border-2 font-bold", isGeneratingCredit && !selectedCustomerId && "border-accent animate-pulse")}>
                    <SelectValue placeholder="Selecione o Cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avulso">-- Sem Vínculo --</SelectItem>
                  {customers.map((c: Customer) => (
                      <SelectItem key={c.id} value={c.id!} className="text-xs font-medium">
                        {c.name} {c.balance !== 0 && `(R$ ${c.balance.toFixed(2)})`}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Forma de Pagamento Principal</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 bg-background border-2 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Débito">Débito</SelectItem>
                  <SelectItem value="Crédito">Crédito</SelectItem>
                  {!isGeneratingCredit && <SelectItem value="Fiado">Fiado (A Prazo)</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="h-12 font-bold uppercase text-[10px]">Cancelar</Button>
          <Button onClick={handleFinalize} disabled={processing} className={cn(
              "h-12 font-black uppercase text-xs shadow-lg flex-1",
              isGeneratingCredit ? "bg-accent hover:bg-accent/80 text-white" : "bg-green-600 hover:bg-green-700 text-white"
          )}>
            {processing ? <Spinner size="h-4 w-4" /> : isGeneratingCredit ? `Confirmar e Gerar Crédito` : `Confirmar Recebimento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
