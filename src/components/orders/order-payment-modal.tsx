'use client';

import { Order, OrderItem, Customer } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface OrderPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    displayName: string;
    items: OrderItem[];
    total: number;
  };
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCloseAll: () => void; // Function to close all modals
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
      // Step 1: Create the transaction and update stock
      await finalizeOrder(
        { items: order.items, total: order.total, displayName: order.displayName },
        selectedCustomerId,
        paymentMethod
      );

      // Step 2: If successful, delete the open order document
      await onDeleteOrder(order.id);
      
      // Step 3: Close all modals
      onCloseAll();

    } catch (error: any) {
      // The finalizeOrder function already shows a toast on error
      console.error('Failed to finalize order:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar {order.displayName}</DialogTitle>
          <DialogDescription>
            Total a Pagar: <span className="font-bold text-lg text-foreground">R$ {order.total.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 grid gap-4">
          <div className="w-full space-y-2">
            <Label htmlFor="payment-method-select">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Débito">Débito</SelectItem>
                <SelectItem value="Crédito">Crédito</SelectItem>
                <SelectItem value="Fiado">Fiado (A Prazo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'Fiado' && (
            <div className="w-full space-y-2">
              <Label htmlFor="customer-select">Cliente</Label>
              <Select onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: Customer) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.name} (Saldo: R$ {c.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleFinalize} disabled={processing}>
            {processing ? <Spinner /> : `Confirmar Pagamento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};