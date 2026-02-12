'use client';

import { Order, OrderItem, Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { User, CheckCircle2 } from 'lucide-react';

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
  const { customers, finalizeOrder } = useData();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(order.customerId);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (order.customerId) {
        setSelectedCustomerId(order.customerId);
    }
  }, [order.customerId]);

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

      await finalizeOrder(
        { items: order.items, total: order.total, displayName: finalDisplayName },
        selectedCustomerId,
        paymentMethod
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar: {order.displayName}</DialogTitle>
          <DialogDescription>
            Confirme o meio de pagamento e o vínculo com o cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center justify-center bg-muted/30 p-4 rounded-xl border-2 border-dashed border-primary/20">
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total a Pagar</p>
             <p className="text-4xl font-black text-primary">R$ {order.total.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method-select" className="text-xs font-bold uppercase text-muted-foreground">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method-select" className="h-12 bg-background border-2">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customer-select" className="text-xs font-bold uppercase text-muted-foreground">Vincular Cliente (Histórico/Fiel)</Label>
                {selectedCustomerId && <CheckCircle2 size={14} className="text-accent" />}
              </div>
              <Select value={selectedCustomerId || 'avulso'} onValueChange={(v) => setSelectedCustomerId(v === 'avulso' ? null : v)}>
                <SelectTrigger id="customer-select" className="h-12 bg-background border-2">
                  <SelectValue placeholder="Atendimento Avulso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avulso">-- Sem Vínculo (Avulso) --</SelectItem>
                  {customers.map((c: Customer) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.name} {c.balance > 0 && `(Dívida: R$ ${c.balance.toFixed(2)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomerId && (
                <p className="text-[10px] text-accent font-bold uppercase flex items-center gap-1 mt-1">
                  <User size={10} /> Esta venda será registrada no histórico deste cliente.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="w-full sm:w-auto order-2 sm:order-1">
            Cancelar
          </Button>
          <Button onClick={handleFinalize} disabled={processing} className="w-full sm:w-auto h-12 font-black uppercase order-1 sm:order-2 bg-green-600 hover:bg-green-700 text-white">
            {processing ? <Spinner size="h-4 w-4" /> : `Confirmar Recebimento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
