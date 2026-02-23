
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
import { User, CheckCircle2, TicketPercent, Calendar as CalendarIcon, Trophy, Wallet, Plus, Minus, HandCoins, Info } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
 * @fileOverview Modal de Pagamento Adaptativo com Inteligência de Crédito Seletivo.
 * CEO: Agora permite ativar/desativar o resgate de crédito via Switch.
 * CTO: Implementado suporte a pagamento integral via Saldo Interno ou Híbrido.
 */
export const OrderPaymentModal: React.FC<OrderPaymentModalProps> = ({
  open,
  onOpenChange,
  order,
  onDeleteOrder,
  onCloseAll,
}) => {
  const { gameModalities, customers, finalizeOrder } = useData();
  const { isCaixaOrAdmin } = useAuth();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(order.customerId);
  const [discount, setDiscount] = useState<number>(0);
  const [adjustment, setAdjustment] = useState<number>(0); 
  const [creditApplied, setCreditApplied] = useState<number>(0);
  const [isRedeeming, setIsRedeeming] = useState(false); // Chave de ativação do resgate
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

  const linkedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const availableCredit = useMemo(() => {
    if (!linkedCustomer || linkedCustomer.balance >= 0) return 0;
    return Math.abs(linkedCustomer.balance);
  }, [linkedCustomer]);

  // Cálculo final dinâmico
  const finalTotal = useMemo(() => 
    order.total - discount + adjustment - gamePayoutAmount, 
    [order.total, discount, adjustment, gamePayoutAmount]
  );

  // Se o resgate estiver desligado, creditApplied é forçado a 0
  const effectiveCreditApplied = isRedeeming ? creditApplied : 0;

  const amountToPayNow = useMemo(() => 
    Math.max(0, finalTotal - effectiveCreditApplied),
    [finalTotal, effectiveCreditApplied]
  );

  const isGeneratingCredit = finalTotal < 0;
  const isFullyCoveredByCredit = isRedeeming && amountToPayNow === 0 && finalTotal > 0;

  // Ajusta forma de pagamento se estiver totalmente coberto por crédito
  useEffect(() => {
    if (isFullyCoveredByCredit) {
        setPaymentMethod('SALDO INTERNO');
    } else if (paymentMethod === 'SALDO INTERNO') {
        setPaymentMethod('Dinheiro');
    }
  }, [isFullyCoveredByCredit, paymentMethod]);

  const handleApplyAllCredit = () => {
    const amount = Math.min(finalTotal, availableCredit);
    setCreditApplied(amount > 0 ? amount : 0);
  };

  const handleToggleRedemption = (val: boolean) => {
    setIsRedeeming(val);
    if (!val) setCreditApplied(0);
    else handleApplyAllCredit(); // Sugere tudo ao ativar
  };

  const handleFinalize = async () => {
    if (paymentMethod === 'Fiado' && !selectedCustomerId) {
      toast({
        title: 'Cliente não selecionado',
        description: 'Selecione um fiel para vendas a prazo.',
        variant: 'destructive',
      });
      return;
    }

    if (isGeneratingCredit && !selectedCustomerId) {
        toast({
            title: 'Vincule um Fiel',
            description: 'Para gerar crédito (troco guardado), você deve selecionar um cliente.',
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
        { items: order.items, total: order.total + adjustment, displayName: finalDisplayName, createdAt: order.createdAt },
        selectedCustomerId,
        paymentMethod,
        discount,
        saleDate,
        gamePayoutId !== 'none' && gamePayoutAmount > 0 ? {
          productId: gamePayoutId,
          name: selectedGame?.name || 'Jogo',
          amount: gamePayoutAmount
        } : undefined,
        effectiveCreditApplied
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
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto bg-background border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
            {isGeneratingCredit ? <Wallet className="text-accent" /> : <CheckCircle2 className="text-primary" />}
            Finalizar: {order.displayName}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
            {isGeneratingCredit 
                ? "Confirme a geração de crédito para o cliente." 
                : "Confirme o meio de pagamento e abatimentos."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Dashboard de Valores */}
          <div className={cn(
              "flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed relative transition-all duration-500",
              isGeneratingCredit 
                ? "bg-accent/5 border-accent/40 shadow-[0_0_30px_rgba(20,184,166,0.15)]" 
                : "bg-muted/30 border-primary/20"
          )}>
             <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                {discount > 0 && <Badge variant="destructive" className="text-[8px] font-black uppercase">Desc: -{discount.toFixed(2)}</Badge>}
                {adjustment !== 0 && <Badge className={cn("text-[8px] font-black uppercase", adjustment > 0 ? "bg-primary" : "bg-accent")}>{adjustment > 0 ? 'Extra: +' : 'Abate: '}{adjustment.toFixed(2)}</Badge>}
                {gamePayoutAmount > 0 && <Badge className="text-[8px] font-black uppercase bg-orange-500">Prêmio: -{gamePayoutAmount.toFixed(2)}</Badge>}
                {effectiveCreditApplied > 0 && <Badge className="text-[8px] font-black uppercase bg-accent">Resgate: -{effectiveCreditApplied.toFixed(2)}</Badge>}
             </div>
             
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 opacity-60">
                {isGeneratingCredit ? 'CRÉDITO A GERAR' : (effectiveCreditApplied > 0 ? 'RESTANTE A PAGAR' : 'TOTAL FINAL')}
             </p>
             
             <p className={cn(
                 "text-5xl font-black tracking-tighter transition-all duration-500",
                 isGeneratingCredit ? "text-accent scale-110" : "text-primary"
             )}>
                R$ {Math.abs(isGeneratingCredit ? finalTotal : amountToPayNow).toFixed(2)}
             </p>
             
             {isGeneratingCredit && (
                 <Badge variant="outline" className="mt-6 border-accent text-accent font-black uppercase text-[10px] tracking-widest bg-accent/10 animate-pulse">
                    Gerando Adiantamento
                 </Badge>
             )}
          </div>

          {/* Módulo de Resgate de Crédito Seletivo */}
          {availableCredit > 0 && (
            <div className={cn(
                "p-4 border-2 rounded-2xl space-y-4 transition-all duration-300",
                isRedeeming ? "bg-accent/10 border-accent shadow-[0_0_20px_rgba(20,184,166,0.1)] pulse-subtle" : "bg-muted/20 border-dashed border-border/40"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HandCoins size={18} className={cn(isRedeeming ? "text-accent" : "text-muted-foreground")} />
                        <div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest block", isRedeeming ? "text-accent" : "text-muted-foreground")}>Usar Crédito Acumulado</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Saldo disponível: R$ {availableCredit.toFixed(2)}</span>
                        </div>
                    </div>
                    <Switch 
                        checked={isRedeeming} 
                        onCheckedChange={handleToggleRedemption} 
                        className="data-[state=checked]:bg-accent"
                    />
                </div>

                {isRedeeming && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <div className="relative flex-grow">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-accent/60">R$</span>
                            <Input 
                                type="number" 
                                step="0.01" 
                                max={Math.min(availableCredit, finalTotal > 0 ? finalTotal : 0)}
                                placeholder="Valor..." 
                                value={creditApplied || ''} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCreditApplied(Math.min(val, availableCredit, finalTotal > 0 ? finalTotal : 0));
                                }}
                                className="h-12 pl-9 bg-background border-2 font-black text-accent focus-visible:ring-accent/20 border-accent/20"
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={handleApplyAllCredit}
                            className="h-12 border-accent text-accent font-black uppercase text-[10px] px-6 hover:bg-accent/10 active:scale-95 transition-all"
                        >
                            Tudo
                        </Button>
                    </div>
                )}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1"><TicketPercent size={12}/> Desconto (R$)</Label>
                    <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={discount || ''} 
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="h-12 bg-background border-2 font-black text-destructive focus-visible:ring-destructive/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1"><Plus size={12}/> Ajuste (+/-)</Label>
                    <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: -30.00" 
                        value={adjustment || ''} 
                        onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                        className={cn("h-12 bg-background border-2 font-black focus-visible:ring-primary/20", adjustment > 0 ? "text-primary" : adjustment < 0 ? "text-accent" : "")}
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest"><CalendarIcon size={14} /> Data do Atendimento</Label>
              <DatePicker date={saleDate} setDate={setSaleDate} className="w-full h-12" />
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center justify-between">
                <span>Vincular Fiel</span>
                {isGeneratingCredit && <span className="text-accent font-black animate-pulse">* OBRIGATÓRIO</span>}
              </Label>
              <Select value={selectedCustomerId || 'avulso'} onValueChange={(v) => {
                  setSelectedCustomerId(v === 'avulso' ? null : v);
                  setIsRedeeming(false);
                  setCreditApplied(0);
              }}>
                <SelectTrigger className={cn("h-14 bg-background border-2 font-black transition-all", isGeneratingCredit && !selectedCustomerId ? "border-accent ring-2 ring-accent/20" : "")}>
                    <SelectValue placeholder="Selecione o Cliente..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="avulso" className="text-xs font-black uppercase opacity-50">-- SEM VÍNCULO --</SelectItem>
                  {customers.sort((a,b) => a.name.localeCompare(b.name)).map((c: Customer) => (
                      <SelectItem key={c.id} value={c.id!} className="text-xs font-bold uppercase">
                        {c.name} {c.balance !== 0 && <span className={cn("ml-2", c.balance > 0 ? "text-yellow-500" : "text-accent")}>({c.balance > 0 ? '+' : ''}R$ {c.balance.toFixed(2)})</span>}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-muted-foreground">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className={cn("h-14 bg-background border-2 font-black", paymentMethod === 'SALDO INTERNO' && "border-accent text-accent")}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isFullyCoveredByCredit ? (
                      <SelectItem value="SALDO INTERNO" className="font-black text-accent">SALDO INTERNO (TOTAL)</SelectItem>
                  ) : (
                      <>
                        <SelectItem value="Dinheiro" className="font-bold">DINHEIRO</SelectItem>
                        <SelectItem value="PIX" className="font-bold">PIX</SelectItem>
                        <SelectItem value="Débito" className="font-bold">DÉBITO</SelectItem>
                        <SelectItem value="Crédito" className="font-bold">CRÉDITO (CARTÃO)</SelectItem>
                        {isRedeeming && effectiveCreditApplied > 0 && (
                            <SelectItem value="MISTO (SALDO + OUTRO)" className="font-black text-accent">MISTO (SALDO + OUTRO)</SelectItem>
                        )}
                        {!isGeneratingCredit && effectiveCreditApplied < finalTotal && <SelectItem value="Fiado" className="font-black text-yellow-500">PENDURAR (FIADO)</SelectItem>}
                      </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing} className="h-14 font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
          <Button onClick={handleFinalize} disabled={processing} className={cn(
              "h-14 font-black uppercase text-xs shadow-xl flex-1 tracking-[0.1em] transition-all active:scale-95",
              isGeneratingCredit || isFullyCoveredByCredit ? "bg-accent hover:bg-accent/80 text-white" : "bg-green-600 hover:bg-green-700 text-white"
          )}>
            {processing ? <Spinner size="h-4 w-4" /> : isGeneratingCredit ? `Confirmar Crédito` : isFullyCoveredByCredit ? 'Liquidar via Saldo' : `Finalizar Recebimento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
