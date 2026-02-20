'use client';

import { Order, OrderItem, Product, DoseOption, Customer, GameModality } from '@/lib/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useData } from '@/contexts/data-context';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, ShoppingCart, Save, Search, X, Receipt, ShoppingBasket, UserPlus, Users, AlertTriangle, Menu, Sparkles, Hash, Dices, UserCheck, Package, ChevronRight, LayoutGrid } from 'lucide-react';
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

/**
 * @fileOverview Gestão de Comanda (PDV Premium).
 * CTO: UX de Alta Fidelidade com navegação por categorias em grid e itens em lista.
 */
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
      setSelectedCategory(null);
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

  const productListContent = (
    <div className="flex-grow flex flex-col p-2 sm:p-6 gap-6 overflow-hidden h-full">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar item..." 
            className="pl-12 h-14 bg-card border-none shadow-inner text-lg focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {(selectedCategory || searchTerm) && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] font-black uppercase text-primary gap-1 h-8 px-3 border border-primary/20 bg-primary/5 hover:bg-primary/10"
              onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
            >
              <X size={14} /> Voltar para Categorias
            </Button>
            {selectedCategory && (
              <Badge className="h-8 rounded-md px-4 font-black uppercase tracking-widest text-[9px] bg-primary/20 text-primary border-none">
                {selectedCategory}
              </Badge>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-grow">
        {dataLoading ? (
          <div className="flex justify-center p-12"><Spinner size="h-12 w-12" /></div>
        ) : !selectedCategory && !searchTerm ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
            {categories.map(cat => (
              <Card 
                key={cat} 
                className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all active:scale-95 bg-card/40 border-2 border-border/20 shadow-sm relative overflow-hidden group"
                onClick={() => setSelectedCategory(cat)}
              >
                <div className="p-5 bg-primary/10 rounded-2xl mb-4 group-hover:bg-primary/20 transition-colors shadow-lg shadow-primary/5">
                  <Package size={40} className="text-primary" />
                </div>
                <span className="font-black text-[11px] sm:text-xs uppercase text-center px-2 tracking-[0.15em] text-foreground/80">{cat}</span>
                <ChevronRight className="absolute right-3 bottom-3 h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-24 pr-4">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-card/40 hover:bg-card/60 transition-all cursor-pointer rounded-2xl border-2 border-transparent hover:border-primary/20 group"
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
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        {item.saleType === 'game' ? <Dices size={24} /> : <Package size={24} />}
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-base leading-tight truncate">{item.name}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">{item.category}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="font-black text-lg text-primary">
                            {item.saleType !== 'dose' && item.saleType !== 'service' ? `R$ ${item.unitPrice?.toFixed(2)}` : item.saleType === 'service' ? 'Valor Aberto' : 'Várias Doses'}
                        </p>
                        {item.saleType !== 'service' && item.saleType !== 'game' && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                {item.stock} {item.saleType === 'dose' ? 'ml' : 'un.'} disponível
                            </span>
                        )}
                    </div>
                    {item.saleType === 'dose' ? (
                      <Popover>
                        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}><Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-2 border-primary/20 hover:bg-primary hover:text-white"><Plus className="h-6 w-6" /></Button></PopoverTrigger>
                        <PopoverContent align="end" className="w-64 p-3 shadow-2xl bg-card border-border/40">
                          <div className="flex flex-col gap-2">
                            {item.doseOptions?.filter((d: any) => d.enabled).map((dose: any) => (
                              <Button key={dose.name} onClick={() => handleAddItem(item, dose)} variant="ghost" className="justify-between text-sm h-12 font-black uppercase hover:bg-primary/10 hover:text-primary">
                                <span>{dose.name}</span><span className="text-primary font-black">R$ {dose.price.toFixed(2)}</span>
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-primary/5 border-2 border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Plus className="h-6 w-6" />
                      </div>
                    )}
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-32 text-center opacity-30 italic flex flex-col items-center gap-6">
                <Search size={64} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Nenhum item encontrado.</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const cartContent = (
    <div className="w-full flex flex-col bg-card/50 backdrop-blur-md h-full border-l border-border/20">
      <div className="p-6 border-b border-border/20 flex justify-between items-center shrink-0 h-20">
        <h3 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest"><ShoppingCart className="h-5 w-5 text-primary" /> SACOLA ({currentItems.length})</h3>
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" 
            onClick={() => setIsDeleteAlertOpen(true)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-3 pb-24">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground text-center gap-6 opacity-20">
              <ShoppingBasket size={80} strokeWidth={1} /><p className="text-sm font-black uppercase tracking-widest">Sacola vazia</p>
            </div>
          ) : (
            currentItems.map((item, idx) => (
              <div key={`${item.productId}-${item.doseName || idx}-${item.identifier || ''}`} className="flex items-center justify-between bg-card border border-border/40 rounded-2xl p-4 shadow-lg transition-all hover:border-primary/40 group">
                <div className="flex-grow min-w-0 pr-4">
                  <p className="font-black text-sm truncate uppercase tracking-tight text-foreground">{item.name}</p>
                  {item.doseName && <p className="text-[10px] text-primary font-black uppercase mt-0.5">{item.doseName}</p>}
                  {item.identifier && <p className="text-[10px] text-orange-500 font-black uppercase flex items-center gap-1 mt-0.5"><Hash size={8}/> Ref: {item.identifier}</p>}
                  <p className="text-[11px] font-bold text-muted-foreground mt-1">R$ {item.unitPrice.toFixed(2)} un.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-muted/30 rounded-xl p-1 shadow-inner border border-border/20">
                    {!item.identifier ? (
                        <>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background transition-all" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -1, item.identifier)}><Minus className="h-4 w-4" /></Button>
                            <span className="w-8 text-center text-base font-black">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background transition-all" onClick={() => handleUpdateQuantity(item.productId, item.doseName, 1, item.identifier)}><Plus className="h-4 w-4" /></Button>
                        </>
                    ) : <span className="w-10 text-center text-sm font-black bg-muted/50 py-2 rounded-lg">1x</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -item.quantity, item.identifier)}><Trash2 size={20} /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-6 border-t border-border/20 bg-card mt-auto space-y-6 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-end px-2">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em]">Valor Total</span>
          <span className="text-4xl font-black text-primary tracking-tighter shadow-primary/20 drop-shadow-sm">R$ {total.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="font-black h-16 uppercase text-xs border-2 tracking-widest hover:bg-primary/5 active:scale-95 transition-all" onClick={() => setIsPaymentModalOpen(true)} disabled={currentItems.length === 0}>💲 Receber</Button>
          <Button onClick={handleSaveOrder} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white font-black h-16 uppercase text-xs shadow-xl active:scale-95 transition-all tracking-widest">
            {processing ? <Spinner size="h-6 w-6" /> : <><Save className="mr-2 h-5 w-5" /> Salvar</>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open && !isPaymentModalOpen && !isLinkCustomerOpen && !isDeleteAlertOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-7xl h-[95vh] flex flex-col p-0 overflow-hidden bg-background border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 border-b border-border/20 bg-card flex flex-row items-center justify-between shrink-0 h-24">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5"><Receipt className="h-8 w-8 text-primary" /></div>
              <div className="flex flex-col">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground truncate max-w-[200px] md:max-w-md">{existingOrder?.displayName || 'Comanda'}</DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                    <Badge variant={linkedCustomer ? "default" : "outline"} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-none tracking-widest">
                        {linkedCustomer ? `Fiel: ${linkedCustomer.name}` : 'Avulso'}
                    </Badge>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase text-primary flex items-center gap-1 hover:no-underline hover:text-primary/80" onClick={() => setIsLinkCustomerOpen(true)}>
                        <UserPlus size={12} /> {linkedCustomer ? 'Trocar' : 'Vincular Fiel'}
                    </Button>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">TOTAL ACUMULADO</p>
              <p className="text-4xl font-black text-primary tracking-tighter leading-none">R$ {total.toFixed(2)}</p>
            </div>
          </DialogHeader>
          <div className="flex-grow flex flex-col overflow-hidden">
            <div className="flex flex-col h-full lg:hidden">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-2 bg-card rounded-none h-16 border-b border-border/20 p-0 shadow-sm">
                    <TabsTrigger value="menu" className="gap-3 font-black uppercase text-xs h-full data-[state=active]:text-primary data-[state=active]:bg-primary/5"><Menu size={20}/> Cardápio</TabsTrigger>
                    <TabsTrigger value="cart" className="gap-3 font-black uppercase text-xs h-full relative data-[state=active]:text-primary data-[state=active]:bg-primary/5">
                        <ShoppingCart size={20}/> Sacola {currentItems.length > 0 && <span className="ml-1 px-2 py-0.5 bg-primary text-white rounded-full text-[10px]">{currentItems.length}</span>}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="menu" className="flex-grow overflow-hidden mt-0">{productListContent}</TabsContent>
                <TabsContent value="cart" className="flex-grow overflow-hidden mt-0">{cartContent}</TabsContent>
              </Tabs>
            </div>
            <div className="hidden lg:flex h-full overflow-hidden">
                <div className="flex-grow border-r border-border/20 bg-muted/5 overflow-hidden">{productListContent}</div>
                <div className="w-[480px] shrink-0">{cartContent}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLinkCustomerOpen} onOpenChange={setIsLinkCustomerOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/40 shadow-2xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 font-black uppercase tracking-tight"><Users className="text-primary" /> Vincular Fiel</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Sincronização de histórico de consumo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Pesquisar por nome..." 
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-12 h-14 bg-background border-2 font-bold focus-visible:ring-primary/20"
                        autoFocus
                    />
                </div>
                <ScrollArea className="h-[350px] border border-border/40 rounded-2xl bg-muted/10 shadow-inner">
                    <div className="p-3 space-y-2">
                        {filteredCustomersForLink.map(c => (
                            <Button 
                                key={c.id} 
                                variant="ghost" 
                                className="w-full justify-between h-14 font-black uppercase text-xs hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                onClick={() => handleLinkCustomer(c)}
                            >
                                <span className="truncate pr-4">{c.name}</span>
                                {c.balance > 0 && <Badge variant="outline" className="text-[9px] text-yellow-500 border-yellow-500/20 bg-yellow-500/5 px-2">R$ {c.balance.toFixed(2)}</Badge>}
                            </Button>
                        ))}
                        {filteredCustomersForLink.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground text-xs font-bold uppercase opacity-40">Nenhum fiel encontrado.</div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsLinkCustomerOpen(false)} className="h-12 font-bold uppercase text-xs">Cancelar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToCustomize} onOpenChange={(o) => !o && setItemToCustomize(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/40 shadow-2xl">
            <DialogHeader><DialogTitle className="flex items-center gap-3 font-black uppercase tracking-tight"><Dices className="text-orange-500" /> {itemToCustomize?.name}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor do Registro (R$)</Label>
                    <Input type="number" step="0.01" value={customData.price} onChange={(e) => setCustomItemData(p => ({ ...p, price: e.target.value }))} className="h-16 text-3xl font-black text-primary bg-background border-none shadow-inner" placeholder="0.00" autoFocus />
                </div>
                {itemToCustomize?.type === 'game' && (
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Referência / Milhar / Máquina</Label>
                        <Input value={customData.identifier} onChange={(e) => setCustomItemData(p => ({ ...p, identifier: e.target.value }))} className="h-14 font-black uppercase bg-background border-2" placeholder="Ex: Milhar 1234..." />
                    </div>
                )}
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setItemToCustomize(null)} className="h-14 font-bold uppercase text-xs">Cancelar</Button><Button onClick={handleCustomConfirm} className="bg-primary text-white font-black uppercase h-14 px-8 shadow-lg">Confirmar Registro</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-card border-2 border-border/40 shadow-2xl rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-destructive font-black uppercase tracking-tight">
              <AlertTriangle size={24} /> Excluir Atendimento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed mt-2 tracking-tight">
              Você está prestes a apagar permanentemente a comanda <strong className="text-foreground">{existingOrder?.displayName}</strong>. Esta ação é irreversível e todos os lançamentos acumulados serão anulados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-14 font-black uppercase text-[10px] border-2 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrder} 
              className="bg-destructive text-white hover:bg-destructive/90 h-14 font-black uppercase text-[10px] shadow-lg px-10 rounded-xl"
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
