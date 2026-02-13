
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
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

  // UX: Clientes ordenados alfabeticamente (A-Z) para busca rápida
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [customers]);

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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-2 bg-card border-b">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-xl font-bold">Nova Comanda</DialogTitle>
                <DialogDescription className="text-xs">Identifique o atendimento para iniciar.</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-14 bg-muted/50 p-1">
                <TabsTrigger value="avulsa" className="gap-2 font-bold uppercase text-[10px] sm:text-xs h-full">
                <LayoutGrid size={14} className="hidden sm:block" /> Mesa
                </TabsTrigger>
                <TabsTrigger value="cliente" className="gap-2 font-bold uppercase text-[10px] sm:text-xs h-full">
                <Users size={14} className="hidden sm:block" /> Fiel
                </TabsTrigger>
                <TabsTrigger value="novo" className="gap-2 font-bold uppercase text-[10px] sm:text-xs h-full">
                <UserRoundPlus size={14} className="hidden sm:block" /> + Cliente
                </TabsTrigger>
            </TabsList>

            <TabsContent value="avulsa" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                <div className="space-y-3">
                <Label htmlFor="display-name" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Identificação da Mesa/Comanda</Label>
                <Input
                    id="display-name"
                    placeholder="Ex: Mesa 05, Balcão, Luis..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-14 bg-background border-2 focus:border-primary text-lg"
                    autoFocus
                />
                <p className="text-[10px] text-muted-foreground italic px-1">
                    * Uso rápido. Não gera registro no histórico de clientes.
                </p>
                </div>
            </TabsContent>

            <TabsContent value="cliente" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                <div className="space-y-3">
                <Label htmlFor="customer-select" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Selecionar Cliente Fiel (A-Z)</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger id="customer-select" className="h-14 bg-background border-2 text-lg">
                    <SelectValue placeholder="Busque um cliente..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                    {sortedCustomers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">Nenhum cliente cadastrado.</div>
                    ) : (
                        sortedCustomers.map(c => (
                        <SelectItem key={c.id} value={c.id!} className="py-3">
                            <div className="flex flex-col">
                                <span className="font-bold">{c.name}</span>
                                {c.balance > 0 && <span className="text-[10px] text-yellow-500 font-black">DÍVIDA: R$ {c.balance.toFixed(2)}</span>}
                            </div>
                        </SelectItem>
                        ))
                    )}
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-accent font-bold uppercase px-1">
                    💡 Esta venda será vinculada ao histórico deste cliente.
                </p>
                </div>
            </TabsContent>

            <TabsContent value="novo" className="space-y-4 py-2 mt-0 focus-visible:outline-none">
                <div className="space-y-3">
                <Label htmlFor="new-customer-name" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Nome do Novo Cliente</Label>
                <Input
                    id="new-customer-name"
                    placeholder="Nome completo para o cadastro"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="h-14 bg-background border-2 focus:border-primary text-lg"
                />
                <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg">
                    <p className="text-[10px] text-accent font-black uppercase tracking-tight leading-relaxed">
                        Isso criará um novo registro na sua lista de clientes e abrirá a comanda simultaneamente.
                    </p>
                </div>
                </div>
            </TabsContent>
            </Tabs>
        </div>

        <DialogFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="w-full sm:w-auto order-2 sm:order-1 h-14 font-bold uppercase text-xs">
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={processing} className="w-full sm:flex-1 order-1 sm:order-2 h-14 font-black uppercase text-sm shadow-lg">
            {processing ? <Spinner size="h-4 w-4" /> : (tab === 'novo' ? 'Cadastrar e Abrir' : 'Abrir Comanda')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
