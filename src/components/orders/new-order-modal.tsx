'use client';

import { useState, useCallback, useEffect } from 'react';
import { Order } from '@/lib/schemas';
import { useData } from '@/contexts/data-context';
import { useOpenOrders } from '@/firebase/firestore/use-open-orders';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, LayoutGrid, Users, UserRoundPlus } from 'lucide-react';

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: Order) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { customers } = useData();
  const { createOrder, createOrderForNewCustomer } = useOpenOrders();
  const { toast } = useToast();

  const [tab, setTab] = useState<'avulsa' | 'cliente' | 'novo'>('avulsa');
  const [displayName, setDisplayName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [processing, setProcessing] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTab('avulsa');
      setDisplayName('');
      setSelectedCustomerId('');
      setNewCustomerName('');
      setProcessing(false);
    }
  }, [open]);

  const handleCreate = async () => {
    setProcessing(true);
    try {
      let order: Order;

      if (tab === 'avulsa') {
        if (!displayName.trim()) {
          toast({ title: 'Atenção', description: 'Digite uma identificação (Mesa ou Nome).', variant: 'destructive' });
          setProcessing(false);
          return;
        }
        order = await createOrder({ displayName: displayName.trim() });
      } else if (tab === 'cliente') {
        if (!selectedCustomerId) {
          toast({ title: 'Atenção', description: 'Selecione um cliente da lista.', variant: 'destructive' });
          setProcessing(false);
          return;
        }
        const customer = customers.find(c => c.id === selectedCustomerId);
        order = await createOrder({ 
          displayName: customer?.name || 'Cliente', 
          customerId: selectedCustomerId 
        });
      } else {
        // tab === 'novo'
        if (!newCustomerName.trim()) {
          toast({ title: 'Atenção', description: 'Digite o nome do novo cliente.', variant: 'destructive' });
          setProcessing(false);
          return;
        }
        order = await createOrderForNewCustomer(newCustomerName.trim());
        toast({ title: 'Novo Cliente!', description: `Cadastro e comanda criados para "${newCustomerName}".` });
      }
      
      if (tab !== 'novo') {
        toast({ title: 'Sucesso!', description: `Comanda "${order.displayName}" aberta.` });
      }
      
      onSuccess(order);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create order", error);
      toast({ title: 'Erro ao Criar', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <UserPlus className="h-5 w-5 text-primary" />
             Nova Comanda
          </DialogTitle>
          <DialogDescription>
            Escolha como identificar este novo atendimento.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="avulsa" className="gap-1 text-[11px] sm:text-xs">
              <LayoutGrid size={14} /> Mesa
            </TabsTrigger>
            <TabsTrigger value="cliente" className="gap-1 text-[11px] sm:text-xs">
              <Users size={14} /> Fiel
            </TabsTrigger>
            <TabsTrigger value="novo" className="gap-1 text-[11px] sm:text-xs">
              <UserRoundPlus size={14} /> + Cliente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="avulsa" className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="display-name">Identificação da Comanda</Label>
              <Input
                id="display-name"
                placeholder="Ex: Mesa 05, Balcão, Luis..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                * Uso pontual. Não cria cadastro permanente.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cliente" className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-select">Selecionar Cliente Cadastrado</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Busque um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">Nenhum cliente cadastrado.</div>
                  ) : (
                    customers.map(c => (
                      <SelectItem key={c.id} value={c.id!}>
                        {c.name} {c.balance > 0 && `(R$ ${c.balance.toFixed(2)})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="novo" className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-customer-name">Nome do Novo Cliente</Label>
              <Input
                id="new-customer-name"
                placeholder="Nome completo para o cadastro"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <p className="text-[10px] text-accent font-bold uppercase tracking-tight">
                💡 Isso criará um novo perfil na sua lista de clientes automaticamente.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={processing} className="min-w-[140px]">
            {processing ? <Spinner size="h-4 w-4" /> : (tab === 'novo' ? 'Cadastrar e Abrir' : 'Abrir Comanda')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
