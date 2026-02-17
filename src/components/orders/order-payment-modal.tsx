
'use client';

import { Order, OrderItem, Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { User, CheckCircle2, TicketPercent, Calendar as CalendarIcon, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { DatePicker } from '@/components/ui/date-picker';

interface OrderPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    displayName: string;
    items: OrderItem[];
    total: number;
    customerId: string | null;
  };
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCloseAll: () => void;
}

export const OrderPaymentModal: React.FC<OrderPaymentModalProps> = ({
  open,
  onOpenChange,
  order,
  onDeleteOrder,
  onCloseAll,
}) => {
  const { products, customers, finalizeOrder } = useData();
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

  const gameModalities = useMemo(() => 
    products.filter(p => p.saleType === 'game'), 
    [products]
  );

  useEffect(() => {
    if (order.customerId) {
        setSelectedCustomerId(order.customerId);
    }
  }, [order.customerId]);

  const finalTotal = useMemo(() => 
    Math.max(0, order.total - discount - gamePayoutAmount), 
    [order.total, discount, gamePayoutAmount]
  );

  const handleFinalize = async () => {
    if (paymentMethod === 'Fiado' && !selectedCustomerId) {
      toast({
        title: 'Cliente não selecionado',
        description: 'Por favor, selecione um cliente para vendas a prazo (fiado).',
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
        { items: order.items, total: order.total, displayName: finalDisplayName },
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
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar: {order.displayName}</DialogTitle>
          <DialogDescription>
            Confirme o meio de pagamento, abatimentos e o vínculo com o fiel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Dashboard de Total */}
          <div className="flex flex-col items-center justify-center bg-muted/30 p-4 rounded-xl border-2 border-dashed border-primary/20 relative">
             <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                {discount > 0 && (
                  <span className="text-[10px] bg-destructive text-white px-2 py-0.5 rounded-full font-bold">
                    Desc: -{discount.toFixed(2)}
                  </span>
                )}
                {gamePayoutAmount > 0 && (
                  <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                    Prêmio: -{gamePayoutAmount.toFixed(2)}
                  </span>
                )}
             </div>
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total a Pagar</p>
             <p className="text-4xl font-black text-primary">R$ {finalTotal.toFixed(2)}</p>
             {(discount > 0 || gamePayoutAmount > 0) && (
                <p className="text-[10px] text-muted-foreground line-through opacity-50">Original: R$ {order.total.toFixed(2)}</p>
             )}
          </div>

          <div className="space-y-4">
            {/* Data da Venda */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                <CalendarIcon size={14} /> Data do Atendimento
              </Label>
              <DatePicker date={saleDate} setDate={setSaleDate} className="w-full" />
            </div>

            {/* Prêmio de Jogo (Abatimento da Banca) */}
            {isCaixaOrAdmin && (
              <div className="space-y-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy size={14} className="text-orange-500" />
                  <Label className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Pagar com Prêmio de Jogo</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={gamePayoutId} onValueChange={setGamePayoutId}>
                    <SelectTrigger className="h-10 bg-background border-orange-500/30 text-xs font-bold uppercase">
                      <SelectValue placeholder="Selecione o Jogo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Sem Prêmio --</SelectItem>
                      {gameModalities.map(g => (
                        <SelectItem key={g.id} value={g.id!} className="text-xs font-bold uppercase">{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Valor R$"
                    value={gamePayoutAmount || ''}
                    onChange={(e) => setGamePayoutAmount(Math.min(order.total - discount, parseFloat(e.target.value) || 0))}
                    className="h-10 bg-background border-orange-500/30 focus:border-orange-500 font-black text-orange-500"
                    disabled={gamePayoutId === 'none'}
                  />
                </div>
                {gamePayoutAmount > 0 && (
                    <p className="text-[9px] text-orange-500 font-bold uppercase italic">
                        * Este valor será deduzido da receita da Banca Jogos.
                    </p>
                )}
              </div>
            )}

            {/* Desconto Estratégico (Somente Admin) */}
            {isAdmin && (
              <div className="space-y-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TicketPercent size={14} className="text-accent" />
                  <Label htmlFor="discount-input" className="text-[10px] font-black uppercase text-accent tracking-widest">Desconto Estratégico (Bar)</Label>
                </div>
                <Input 
                  id="discount-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={order.total - gamePayoutAmount}
                  placeholder="0.00"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.min(order.total - gamePayoutAmount, parseFloat(e.target.value) || 0))}
                  className="h-10 bg-background border-accent/30 focus:border-accent font-black text-accent"
                />
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="payment-method-select" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method-select" className="h-12 bg-background border-2 font-bold">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Débito">Débito</SelectItem>
                  <SelectItem value="Crédito">Crédito</SelectItem>
                  <SelectItem value="Fiado">Fiado (A Prazo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vínculo com Cliente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customer-select" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vincular Fiel</Label>
                {selectedCustomerId && <CheckCircle2 size={14} className="text-accent" />}
              </div>
              <Select value={selectedCustomerId || 'avulso'} onValueChange={(v) => setSelectedCustomerId(v === 'avulso' ? null : v)}>
                <SelectTrigger id="customer-select" className="h-12 bg-background border-2 font-bold">
                  <SelectValue placeholder="Atendimento Avulso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avulso">-- Sem Vínculo (Avulso) --</SelectItem>
                  {customers.sort((a,b) => a.name.localeCompare(b.name)).map((c: Customer) => (
                    <SelectItem key={c.id} value={c.id!} className="text-xs font-medium">
                      {c.name} {c.balance > 0 && `(Débito: R$ ${c.balance.toFixed(2)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="w-full sm:w-auto order-2 sm:order-1 font-bold uppercase text-xs">
            Cancelar
          </Button>
          <Button onClick={handleFinalize} disabled={processing} className="w-full sm:w-auto h-12 font-black uppercase order-1 sm:order-2 bg-green-600 hover:bg-green-700 text-white shadow-lg">
            {processing ? <Spinner size="h-4 w-4" /> : `Confirmar Recebimento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
