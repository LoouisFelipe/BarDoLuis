'use client';

import { Order, OrderItem, Product, DoseOption, Customer, GameModality } from '@/lib/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useData } from '@/contexts/data-context';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, ShoppingCart, Save, Search, X, Receipt, ShoppingBasket, UserPlus, Users, AlertTriangle, Menu, Sparkles, Hash, Dices, UserCheck } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useToast } from '@/hooks/use-toast';
import { OrderPaymentModal } from './order-payment-modal';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOpenOrders } from '@/hooks/use-open-orders';
import { useAuth } from '@/contexts/auth-context';
import { Label } from '../ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrderManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrder: Order;
  onUpdateOrder: (orderId: string, items: OrderItem[]) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export const OrderManagementModal: React.FC<OrderManagementModalProps> = ({
  open,
  onOpenChange,
  existingOrder,
  onUpdateOrder,
  onDeleteOrder,
}) => {
  const { products, gameModalities, customers, loading: dataLoading } = useData();
  const { isAdmin } = useAuth();
  const { updateOrderCustomer } = useOpenOrders();
  const { toast } = useToast();
  
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLinkCustomerOpen, setIsLinkCustomerOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');

  // Estado para Jogo / Valor Aberto
  const [itemToCustomize, setItemToCustomize] = useState<{ id: string, name: string, type: 'game' | 'service', unitPrice?: number } | null>(null);
  const [customData, setCustomItemData] = useState({ price: '', identifier: '' });

  const linkedCustomer = useMemo(() => 
    customers.find(c => c.id === existingOrder?.customerId),
    [customers, existingOrder?.customerId]
  );

  useEffect(() => {
    if (open && existingOrder) {
      setCurrentItems(JSON.parse(JSON.stringify(existingOrder.items ?? [])));
      setIsPaymentModalOpen(false);
      setIsLinkCustomerOpen(false);
      setIsDeleteAlertOpen(false);
      setSearchTerm('');
      setCustomerSearch('');
      setActiveTab('menu');
      setItemToCustomize(null);
    }
  }, [open, existingOrder]);
  
  const total = useMemo(() => currentItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [currentItems]);

  const categories = useMemo(() => {
    const cats = new Set([...products.map(p => p.category), "Entretenimento"]);
    return Array.from(cats).sort();
  }, [products]);

  const filteredItems = useMemo(() => {
    const allProducts = products.map(p => ({ ...p, type: 'product' as const }));
    const allGames = gameModalities.map(g => ({ ...g, type: 'game' as const, saleType: 'game' as const, stock: null }));
    
    return [...allProducts, ...allGames].filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || p.category === selectedCategory || (selectedCategory === "Entretenimento" && p.type === 'game');
        return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, gameModalities, searchTerm, selectedCategory]);

  const filteredCustomersForLink = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, customerSearch]);

  const handleUpdateQuantity = (productId: string, doseName: string | undefined | null, change: number, identifier?: string) => {
    setCurrentItems(prevItems => {
      const newItems = [...prevItems];
      const itemIndex = newItems.findIndex(i => 
        i.productId === productId && 
        (i.doseName === doseName || (!i.doseName && !doseName)) &&
        i.identifier === identifier
      );
      if (itemIndex === -1) return prevItems;
      const newQuantity = newItems[itemIndex].quantity + change;
      if (newQuantity <= 0) {
        newItems.splice(itemIndex, 1);
      } else {
        newItems[itemIndex].quantity = newQuantity;
      }
      return newItems;
    });
  };
  
  const handleAddItem = useCallback((item: any, dose?: DoseOption, customPrice?: number, identifier?: string) => {
     if (!item.id) return;
     const newItem: OrderItem = {
        productId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: customPrice !== undefined ? customPrice : (dose ? dose.price : (item.unitPrice || 0)),
        ...(dose?.name ? { doseName: dose.name } : {}),
        ...(dose?.size ? { size: dose.size } : {}),
        ...(identifier ? { identifier } : {}),
    };
    setCurrentItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(i => 
            i.productId === newItem.productId && 
            i.doseName === newItem.doseName &&
            i.identifier === newItem.identifier
        );
        if (existingItemIndex > -1 && !newItem.identifier) {
            const updated = [...prevItems];
            updated[existingItemIndex].quantity += 1;
            return updated;
        } else {
            return [...prevItems, newItem];
        }
    });
    toast({ description: `${newItem.name} adicionado!`, duration: 800, className: "bg-primary text-primary-foreground border-none font-bold" });
  }, [toast]);

  const handleCustomConfirm = () => {
    if (!itemToCustomize) return;
    const price = parseFloat(customData.price) || 0;
    handleAddItem(itemToCustomize, undefined, price, customData.identifier);
    setItemToCustomize(null);
    setCustomItemData({ price: '', identifier: '' });
  };

  const handleSaveOrder = async () => {
    if (!existingOrder?.id) return;
    setProcessing(true);
    try {
        await onUpdateOrder(existingOrder.id, currentItems);
        toast({ title: "Comanda Salva", className: "bg-green-600 text-white font-bold" });
        onOpenChange(false);
    } catch (error: any) {
        console.error(error);
        toast({ title: "Erro ao Salvar", variant: "destructive" });
    } finally {
        setProcessing(false);
    }
  };

  const handleLinkCustomer = async (customer: Customer) => {
    if (!existingOrder.id || !customer.id) return;
    setProcessing(true);
    try {
      await updateOrderCustomer(existingOrder.id, customer.id, customer.name);
      toast({ title: "Cliente Vinculado", description: `Comanda agora pertence a ${customer.name}` });
      setIsLinkCustomerOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!existingOrder.id) return;
    setProcessing(true);
    try {
      await onDeleteOrder(existingOrder.id);
      toast({ title: "Comanda Excluída", description: "O atendimento foi removido permanentemente." });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir comanda:", error);
      toast({ title: "Erro ao Excluir", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null; 

  const productListContent = (
    <div className="flex-grow flex flex-col p-2 sm:p-4 gap-4 overflow-hidden h-full">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar item..." 
            className="pl-10 h-12 bg-card shadow-sm border-2 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" className="rounded-full text-[10px] font-black uppercase whitespace-nowrap h-8 px-4" onClick={() => setSelectedCategory(null)}>Todos</Button>
          {categories.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" className="rounded-full text-[10px] font-black uppercase whitespace-nowrap h-8 px-4" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-grow">
        {dataLoading ? <div className="flex justify-center p-8"><Spinner /></div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-20 md:pb-10">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                className="hover:border-primary transition-all cursor-pointer active:scale-95 shadow-sm overflow-hidden" 
                onClick={() => {
                    if (item.saleType === 'game') {
                        setItemToCustomize({ id: item.id!, name: item.name, type: 'game', unitPrice: item.unitPrice });
                        setCustomItemData({ price: String(item.unitPrice || ''), identifier: '' });
                    } else if (item.saleType === 'service') {
                        setItemToCustomize({ id: item.id!, name: item.name, type: 'service' });
                        setCustomItemData({ price: '', identifier: '' });
                    } else if (item.saleType !== 'dose') {
                        handleAddItem(item);
                    }
                }}
              >
                <CardContent className="p-3 flex flex-col justify-between h-full gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight truncate">{item.name}</p>
                        <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter mt-0.5">{item.category}</p>
                    </div>
                    {item.saleType !== 'service' && item.saleType !== 'game' && (
                        <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded",
                            (item.stock || 0) <= 5 ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                        )}>
                          {item.stock} {item.saleType === 'dose' ? 'ml' : 'un.'}
                        </span>
                    )}
                    {item.saleType === 'game' && <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[8px] font-black">BANCA</Badge>}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-primary text-base">
                        {item.saleType !== 'dose' && item.saleType !== 'service' ? `R$ ${item.unitPrice?.toFixed(2)}` : item.saleType === 'service' ? 'Valor Aberto' : 'Várias Doses'}
                    </span>
                    {item.saleType === 'dose' ? (
                      <Popover>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}><Button size="icon" variant="outline" className="h-10 w-10 rounded-full border-2"><Plus className="h-5 w-5" /></Button></PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-2 shadow-2xl">
                          <div className="flex flex-col gap-1">
                            {item.doseOptions?.filter((d: any) => d.enabled).map((dose: any) => (
                              <Button key={dose.name} onClick={() => handleAddItem(item, dose)} variant="ghost" className="justify-between text-xs h-11 font-bold">
                                <span>{dose.name}</span><span className="font-black text-primary">R$ {dose.price.toFixed(2)}</span>
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center"><Plus className="h-5 w-5 text-primary" /></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const cartContent = (
    <div className="w-full flex flex-col bg-card h-full">
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center shrink-0">
        <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tight"><ShoppingCart className="h-4 w-4" /> Sacola ({currentItems.length})</h3>
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive" 
            onClick={() => setIsDeleteAlertOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-3 space-y-3 pb-24">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center gap-4 opacity-40">
              <ShoppingBasket size={64} strokeWidth={1} /><p className="text-sm font-black uppercase">Sacola vazia</p>
            </div>
          ) : (
            currentItems.map((item, idx) => (
              <div key={`${item.productId}-${item.doseName || idx}-${item.identifier || ''}`} className="flex items-center justify-between bg-background border-2 rounded-xl p-3 shadow-sm transition-all hover:border-primary/30">
                <div className="flex-grow min-w-0 pr-2">
                  <p className="font-black text-xs truncate leading-none mb-1">{item.name}</p>
                  {item.doseName && <p className="text-[9px] text-primary font-black uppercase">{item.doseName}</p>}
                  {item.identifier && <p className="text-[9px] text-orange-500 font-black uppercase flex items-center gap-1"><Hash size={8}/> Ref: {item.identifier}</p>}
                  <p className="text-[10px] font-bold text-muted-foreground">R$ {item.unitPrice.toFixed(2)} un.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                  {!item.identifier ? (
                    <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-background" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -1, item.identifier)}><Minus className="h-4 w-4" /></Button>
                        <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-background" onClick={() => handleUpdateQuantity(item.productId, item.doseName, 1, item.identifier)}><Plus className="h-4 w-4" /></Button>
                    </>
                  ) : <span className="w-6 text-center text-sm font-black">1x</span>}
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive ml-1" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -item.quantity, item.identifier)}><Trash2 size={18} /></Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card mt-auto space-y-3 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-end px-1">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valor Total</span>
          <span className="text-3xl font-black text-primary">R$ {total.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="font-black h-14 uppercase text-xs border-2" onClick={() => setIsPaymentModalOpen(true)} disabled={currentItems.length === 0}>💲 Receber</Button>
          <Button onClick={handleSaveOrder} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white font-black h-14 uppercase text-xs shadow-lg">
            {processing ? <Spinner size="h-5 w-5" /> : <><Save className="mr-2 h-5 w-5" /> Salvar</>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open && !isPaymentModalOpen && !isLinkCustomerOpen && !isDeleteAlertOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[100vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b bg-card flex flex-row items-center justify-between shrink-0 h-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><Receipt className="h-6 w-6 text-primary" /></div>
              <div className="flex flex-col">
                <DialogTitle className="text-lg md:text-xl font-black truncate max-w-[200px] md:max-w-md">{existingOrder?.displayName || 'Comanda'}</DialogTitle>
                <div className="flex items-center gap-2">
                    <Badge variant={linkedCustomer ? "default" : "outline"} className="text-[8px] font-black uppercase">
                        {linkedCustomer ? `Fiel: ${linkedCustomer.name}` : 'Avulso'}
                    </Badge>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[9px] font-black uppercase text-primary flex items-center gap-1" onClick={() => setIsLinkCustomerOpen(true)}>
                        <UserPlus size={10} /> {linkedCustomer ? 'Trocar' : 'Vincular Fiel'}
                    </Button>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Total</p>
              <p className="text-2xl font-black text-primary leading-none">R$ {total.toFixed(2)}</p>
            </div>
          </DialogHeader>
          <div className="flex-grow flex flex-col overflow-hidden bg-muted/10">
            <div className="flex flex-col h-full md:hidden">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-2 bg-card rounded-none h-14 border-b p-0"><TabsTrigger value="menu" className="gap-2 font-black uppercase text-xs h-full"><Menu size={16}/> Cardápio</TabsTrigger><TabsTrigger value="cart" className="gap-2 font-black uppercase text-xs h-full relative"><ShoppingCart size={16}/> Sacola {currentItems.length > 0 && <span className="ml-1 px-1.5 bg-primary text-white rounded-full">{currentItems.length}</span>}</TabsTrigger></TabsList>
                <TabsContent value="menu" className="flex-grow overflow-hidden mt-0">{productListContent}</TabsContent>
                <TabsContent value="cart" className="flex-grow overflow-hidden mt-0">{cartContent}</TabsContent>
              </Tabs>
            </div>
            <div className="hidden md:flex h-full overflow-hidden"><div className="flex-grow border-r bg-muted/5 overflow-hidden">{productListContent}</div><div className="w-[450px] shrink-0">{cartContent}</div></div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Vínculo de Cliente */}
      <Dialog open={isLinkCustomerOpen} onOpenChange={setIsLinkCustomerOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Users className="text-primary" /> Vincular Cliente Fiel</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">Vincule esta comanda ao histórico de um fiel.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nome..." 
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-10 h-12 bg-background border-2"
                        autoFocus
                    />
                </div>
                <ScrollArea className="h-[300px] border rounded-lg bg-muted/5">
                    <div className="p-2 space-y-1">
                        {filteredCustomersForLink.map(c => (
                            <Button 
                                key={c.id} 
                                variant="ghost" 
                                className="w-full justify-between h-12 font-bold hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleLinkCustomer(c)}
                            >
                                <span className="truncate">{c.name}</span>
                                {c.balance > 0 && <Badge variant="outline" className="text-[8px] text-yellow-500 border-yellow-500/20">R$ {c.balance.toFixed(2)}</Badge>}
                            </Button>
                        ))}
                        {filteredCustomersForLink.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-xs italic">Nenhum cliente encontrado.</div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsLinkCustomerOpen(false)}>Cancelar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToCustomize} onOpenChange={(o) => !o && setItemToCustomize(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Dices className="text-orange-500" /> {itemToCustomize?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Valor do Registro (R$)</Label>
                    <Input type="number" step="0.01" value={customData.price} onChange={(e) => setCustomItemData(p => ({ ...p, price: e.target.value }))} className="h-12 text-xl font-black text-primary" placeholder="0.00" autoFocus />
                </div>
                {itemToCustomize?.type === 'game' && (
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Referência / Milhar / Cartela</Label>
                        <Input value={customData.identifier} onChange={(e) => setCustomItemData(p => ({ ...p, identifier: e.target.value }))} className="h-12 font-bold" placeholder="Ex: Milhar 1234..." />
                    </div>
                )}
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setItemToCustomize(null)}>Cancelar</Button><Button onClick={handleCustomConfirm} className="bg-primary text-white font-black uppercase">Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-card border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} /> Excluir Comanda?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed">
              Você está prestes a apagar permanentemente a comanda <strong>{existingOrder?.displayName}</strong>. Esta ação não pode ser desfeita e todos os itens lançados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 font-bold uppercase text-[10px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrder} 
              className="bg-destructive text-white hover:bg-destructive/90 h-12 font-black uppercase text-[10px] shadow-lg"
            >
              Sim, Excluir Comanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isPaymentModalOpen && (
        <OrderPaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} order={{ id: existingOrder?.id || '', displayName: existingOrder?.displayName || '', items: currentItems, total, customerId: existingOrder?.customerId || null }} onDeleteOrder={onDeleteOrder} onCloseAll={() => { setIsPaymentModalOpen(false); onOpenChange(false); }} />
      )}
    </>
  );
};