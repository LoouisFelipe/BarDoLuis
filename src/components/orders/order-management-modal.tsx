'use client';

import { Order, OrderItem, Product, DoseOption, Customer, GameModality } from '@/lib/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useData } from '@/contexts/data-context';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Plus, Minus, Trash2, ShoppingCart, Search, X, Receipt, ShoppingBasket, Users, Menu, Dices, Package, ChevronRight, LayoutGrid, List, Zap, Hash, AlertTriangle } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Badge } from '@/components/ui/badge';
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [itemToCustomize, setItemToCustomize] = useState<{ id: string, name: string, type: 'game' | 'service' | 'manual', unitPrice?: number } | null>(null);
  const [customData, setCustomItemData] = useState({ price: '', identifier: '', name: '' });
  const [manualType, setManualType] = useState<'debit' | 'credit'>('debit');

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
      setManualType('debit');
    }
  }, [open, existingOrder]);
  
  const total = useMemo(() => currentItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [currentItems]);

  const allItems = useMemo(() => {
    const p = products.map(prod => ({ ...prod, type: 'product' as const }));
    const g = gameModalities.map(game => ({ ...game, type: 'game' as const, saleType: 'game' as const, stock: null }));
    return [...p, ...g].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [products, gameModalities]);

  const categories = useMemo(() => {
    const cats = new Set(allItems.map(i => i.category.toUpperCase()));
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || item.category.toUpperCase() === selectedCategory.toUpperCase();
        return matchesSearch && matchesCategory;
    });
  }, [allItems, searchTerm, selectedCategory]);

  const filteredCustomersForLink = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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
  
  const handleAddItem = useCallback((item: any, dose?: DoseOption, customPrice?: number, identifier?: string, customName?: string) => {
     const newItem: OrderItem = {
        productId: item.id || `manual-${Date.now()}`,
        name: customName || item.name,
        quantity: 1,
        unitPrice: customPrice !== undefined ? customPrice : (dose ? dose.price : (item.unitPrice || 0)),
        ...(dose?.name ? { doseName: dose.name } : {}),
        ...(dose?.size ? { size: dose.size } : {}),
        ...(identifier ? { identifier } : {}),
    };
    setCurrentItems(prevItems => {
        if (newItem.productId.startsWith('manual-')) return [...prevItems, newItem];
        const existingItemIndex = prevItems.findIndex(i => i.productId === newItem.productId && i.doseName === newItem.doseName && i.identifier === newItem.identifier);
        if (existingItemIndex > -1 && !newItem.identifier) {
            const updated = [...prevItems];
            updated[existingItemIndex].quantity += 1;
            return updated;
        } else {
            return [...prevItems, newItem];
        }
    });
    const desc = newItem.unitPrice < 0 ? 'Crédito adicionado!' : 'Item adicionado!';
    toast({ description: desc, duration: 800, className: "bg-primary text-primary-foreground font-bold" });
  }, [toast]);

  const handleCustomConfirm = () => {
    if (!itemToCustomize) return;
    let price = parseFloat(customData.price) || 0;
    
    if (manualType === 'credit') {
        price = -Math.abs(price);
    } else {
        price = Math.abs(price);
    }

    handleAddItem(itemToCustomize, undefined, price, customData.identifier, (customData.name || itemToCustomize.name).toUpperCase());
    setItemToCustomize(null);
    setCustomItemData({ price: '', identifier: '', name: '' });
    setManualType('debit');
  };

  const handleSaveOrder = async () => {
    if (!existingOrder?.id) return;
    setProcessing(true);
    try {
        await onUpdateOrder(existingOrder.id, currentItems);
        onOpenChange(false);
    } catch (error) {
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
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro ao Excluir", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const renderItemRow = (item: any) => (
    <div 
      key={`${item.id}-${item.saleType}`} 
      className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer rounded-xl border border-border/10 group active:scale-[0.98]"
      onClick={() => {
          if (item.saleType === 'game') {
              setItemToCustomize({ id: item.id!, name: item.name, type: 'game', unitPrice: item.unitPrice });
              setCustomItemData({ price: String(item.unitPrice || ''), identifier: '', name: '' });
          } else if (item.saleType === 'service') {
              setItemToCustomize({ id: item.id!, name: item.name, type: 'service' });
              setCustomItemData({ price: '', identifier: '', name: '' });
          } else if (item.saleType !== 'dose') {
              handleAddItem(item);
          }
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
              {item.saleType === 'game' ? <Dices size={20} /> : <Package size={20} />}
          </div>
          <div className="min-w-0">
              <p className="font-bold text-sm truncate uppercase tracking-tight text-slate-100">{item.name}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider truncate">{item.subcategory || item.category}</p>
          </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
              <p className="font-black text-sm text-primary tracking-tight">
                  {item.saleType !== 'dose' && item.saleType !== 'service' ? `R$ ${item.unitPrice?.toFixed(2)}` : item.saleType === 'service' ? 'ABERTO' : 'DOSES'}
              </p>
              {item.saleType !== 'service' && item.saleType !== 'game' && (
                  <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest block">
                      {item.stock} {item.saleType === 'dose' ? 'ML' : 'UN.'}
                  </span>
              )}
          </div>
          {item.saleType === 'dose' ? (
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}><Button size="icon" variant="outline" className="h-10 w-10 rounded-lg border-primary/20"><Plus className="h-5 w-5" /></Button></PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2 bg-slate-900 border-slate-800 rounded-2xl shadow-2xl">
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 px-2">Selecione Dose</p>
                  {item.doseOptions?.filter((d: any) => d.enabled).sort((a: any, b: any) => a.name.localeCompare(b.name)).map((dose: any) => (
                    <Button key={dose.name} onClick={() => handleAddItem(item, dose)} variant="ghost" className="justify-between text-xs h-12 font-black uppercase hover:bg-primary/10 rounded-lg px-4">
                      <span>{dose.name}</span><span className="text-primary">R$ {dose.price.toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center"><Plus className="h-5 w-5" /></div>
          )}
      </div>
    </div>
  );

  const productListContent = (
    <div className="flex-grow flex flex-col p-3 sm:p-6 gap-4 overflow-hidden h-full">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
            <div className="relative group flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Buscar item..." className="pl-11 h-12 bg-slate-900/50 border-none text-base font-bold rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 shrink-0">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-10 w-10 rounded-lg"><LayoutGrid size={18} /></Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-10 w-10 rounded-lg"><List size={18} /></Button>
                <Button variant="outline" size="icon" onClick={() => setItemToCustomize({ id: '', name: 'LANÇAMENTO AVULSO', type: 'manual' })} className="h-10 w-10 border-orange-500/40 text-orange-500 rounded-lg"><Zap size={18} fill="currentColor" /></Button>
            </div>
        </div>
        {(selectedCategory || searchTerm) && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-primary h-7 px-3 bg-primary/5 rounded-full" onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}>
              <X size={12} className="mr-1" /> Voltar
            </Button>
            {selectedCategory && <Badge className="h-7 rounded-full px-3 font-black uppercase tracking-widest text-[8px] bg-primary text-white border-none">{selectedCategory}</Badge>}
          </div>
        )}
      </div>

      <ScrollArea className="flex-grow scrollbar-hide">
        {dataLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : !selectedCategory && !searchTerm ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
                {categories.map(cat => (
                <Card key={cat} className="aspect-square flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 bg-slate-900/40 border border-slate-800 shadow-lg relative group hover:border-primary/40 overflow-hidden" onClick={() => setSelectedCategory(cat)}>
                    <div className="p-4 bg-primary/10 rounded-2xl mb-3 group-hover:bg-primary/20 transition-all"><Package size={32} className="text-primary" /></div>
                    <span className="font-black text-[10px] uppercase text-center px-2 tracking-widest text-foreground/90">{cat}</span>
                    <ChevronRight className="absolute right-2 bottom-2 h-4 w-4 text-primary/30" />
                </Card>
                ))}
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2 pb-24">
                {categories.map(cat => {
                    const itemsInCategory = allItems.filter(i => i.category.toUpperCase() === cat);
                    if (itemsInCategory.length === 0) return null;
                    const subcategoriesMap = itemsInCategory.reduce((acc, i) => {
                        const sub = (i.subcategory || 'Diversos').toUpperCase();
                        if (!acc[sub]) acc[sub] = [];
                        acc[sub].push(i);
                        return acc;
                    }, {} as Record<string, any[]>);
                    const sortedSubKeys = Object.keys(subcategoriesMap).sort((a, b) => a.localeCompare(b, 'pt-BR'));
                    return (
                        <AccordionItem key={cat} value={cat} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-md border-b-0">
                            <AccordionTrigger className="px-5 hover:no-underline h-16 group">
                                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20"><Package size={18} /></div><span className="font-black uppercase text-[11px] tracking-widest">{cat}</span><Badge variant="secondary" className="ml-2 text-[9px] font-black bg-slate-800 text-slate-400 border-none">{itemsInCategory.length} Itens</Badge></div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t border-slate-800/50">
                                <div className="flex flex-col">
                                    <Accordion type="multiple">
                                        {sortedSubKeys.map(sub => (
                                            <AccordionItem key={sub} value={sub} className="border-b last:border-0 border-slate-800/30">
                                                <AccordionTrigger className="px-5 py-3 hover:bg-slate-900/60 transition-all border-none">
                                                    <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">{sub}</p>
                                                </AccordionTrigger>
                                                <AccordionContent className="p-2 space-y-1">
                                                    {subcategoriesMap[sub].map(item => renderItemRow(item))}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
          )
        ) : (
          <div className="flex flex-col gap-2 pb-24">
            {filteredItems.map(item => renderItemRow(item))}
            {filteredItems.length === 0 && <div className="py-20 text-center opacity-20 italic flex flex-col items-center gap-4"><Search size={48} /><p className="text-xs font-black uppercase tracking-widest">Nada encontrado</p></div>}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const cartContent = (
    <div className="w-full flex flex-col bg-slate-950/40 backdrop-blur-md h-full border-l border-slate-800/50">
      <div className="p-5 border-b border-slate-800/50 flex justify-between items-center shrink-0 h-16 bg-slate-900/20">
        <h3 className="text-[10px] font-black flex items-center gap-3 uppercase tracking-widest"><ShoppingCart size={16} className="text-primary" /> SACOLA ({currentItems.length})</h3>
        {isAdmin && currentItems.length > 0 && <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => setIsDeleteAlertOpen(true)}><Trash2 size={18} /></Button>}
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-3 pb-24">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center gap-4 opacity-10"><ShoppingBasket size={64} /><p className="text-xs font-black uppercase tracking-widest">Sacola vazia</p></div>
          ) : (
            currentItems.map((item, idx) => (
              <div key={`${item.productId}-${item.doseName || idx}-${item.identifier || ''}`} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex-grow min-w-0 pr-2">
                  <p className="font-bold text-sm truncate uppercase tracking-tight text-foreground">{item.name}</p>
                  {item.doseName && <p className="text-[9px] text-primary font-black uppercase mt-0.5">{item.doseName}</p>}
                  {item.identifier && <p className="text-[9px] text-orange-500 font-black uppercase flex items-center gap-1 mt-0.5"><Hash size={8}/> {item.identifier}</p>}
                  <p className={cn("text-[10px] font-bold mt-1 opacity-60", item.unitPrice < 0 ? "text-emerald-400" : "text-muted-foreground")}>R$ {item.unitPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950/50 rounded-xl p-1 border border-slate-800">
                    {(!item.identifier && !item.productId.startsWith('manual-')) ? (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-lg" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -1, item.identifier)}><Minus size={14} /></Button>
                            <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-lg" onClick={() => handleUpdateQuantity(item.productId, item.doseName, 1, item.identifier)}><Plus size={14} /></Button>
                        </>
                    ) : <span className="w-10 text-center text-xs font-black bg-primary/10 text-primary py-1.5 rounded-lg border border-primary/20">{item.quantity}x</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -item.quantity, item.identifier)}><Trash2 size={18} /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-5 border-t border-slate-800/50 bg-slate-950 mt-auto space-y-4 shrink-0 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-end px-2"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Acumulado</span><span className="text-3xl font-black text-primary tracking-tighter shadow-primary/20 drop-shadow-md">R$ {total.toFixed(2)}</span></div>
        <div className="grid grid-cols-2 gap-3 pb-2"><Button variant="outline" className="font-black h-14 uppercase text-[10px] border-slate-800 tracking-widest rounded-xl hover:bg-slate-900" onClick={() => setIsPaymentModalOpen(true)} disabled={currentItems.length === 0}>💲 RECEBER</Button><Button onClick={handleSaveOrder} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white font-black h-14 uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-green-900/20">{processing ? <Spinner size="h-4 w-4" /> : 'SALVAR'}</Button></div>
      </div>
    </div>
  );

  return (
    <>
      <TooltipProvider>
        <Dialog open={open && !isPaymentModalOpen && !isLinkCustomerOpen && !isDeleteAlertOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] sm:max-w-[1400px] h-full sm:h-[96vh] flex flex-col p-0 overflow-hidden bg-slate-950 border-none shadow-2xl">
            <DialogHeader className="p-5 border-b border-slate-800/50 bg-slate-900/20 flex flex-row items-center justify-between shrink-0 h-20 relative">
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-lg shadow-primary/10"><Receipt className="h-6 w-6 text-primary" /></div>
                <div className="flex flex-col">
                    <DialogTitle className="text-lg font-black uppercase tracking-tight text-white truncate max-w-[150px]">{existingOrder?.displayName || 'COMANDA'}</DialogTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", linkedCustomer ? "bg-primary text-white" : "bg-slate-800 text-muted-foreground")}>{linkedCustomer ? `FIEL: ${linkedCustomer.name}` : 'AVULSO'}</div>
                        <Button variant="link" size="sm" className="h-auto p-0 text-[8px] font-black uppercase text-primary hover:text-primary/80" onClick={() => setIsLinkCustomerOpen(true)}>{linkedCustomer ? 'TROCAR' : 'VINCULAR'}</Button>
                    </div>
                </div>
                </div>
                <div className="text-right flex flex-col items-end gap-0.5 pr-6"><p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Total Acumulado</p><p className="text-2xl font-black text-primary tracking-tighter leading-none shadow-primary/10 drop-shadow-sm">R$ {total.toFixed(2)}</p></div>
                <DialogDescription className="sr-only">Painel de Comanda Mobile Optimized</DialogDescription>
            </DialogHeader>
            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="flex flex-col h-full lg:hidden">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-900/40 rounded-none h-14 border-b border-slate-800/50 p-0 shadow-lg z-10">
                        <TabsTrigger value="menu" className="gap-2 font-black uppercase text-[10px] tracking-widest h-full data-[state=active]:text-primary data-[state=active]:bg-primary/5 transition-all"><Menu size={18}/> CARDÁPIO</TabsTrigger>
                        <TabsTrigger value="cart" className="gap-2 font-black uppercase text-[10px] tracking-widest h-full relative data-[state=active]:text-primary data-[state=active]:bg-primary/5 transition-all"><ShoppingCart size={18}/> SACOLA {currentItems.length > 0 && <span className="ml-1 px-2 py-0.5 bg-primary text-white rounded-full text-[8px]">{currentItems.length}</span>}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="menu" className="flex-grow overflow-hidden mt-0">{productListContent}</TabsContent>
                    <TabsContent value="cart" className="flex-grow overflow-hidden mt-0">{cartContent}</TabsContent>
                </Tabs>
                </div>
                <div className="hidden lg:flex h-full overflow-hidden">
                    <div className="flex-grow border-r border-slate-800/50 bg-slate-950/20 overflow-hidden">{productListContent}</div>
                    <div className="w-[450px] shrink-0">{cartContent}</div>
                </div>
            </div>
            </DialogContent>
        </Dialog>
      </TooltipProvider>
      <Dialog open={isLinkCustomerOpen} onOpenChange={setIsLinkCustomerOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-black uppercase tracking-tight text-white text-sm">
              <Users className="text-primary h-5 w-5" /> VINCULAR FIEL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar fiel..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-10 h-12 bg-slate-950 border-slate-800 font-bold rounded-xl" autoFocus />
            </div>
            <ScrollArea className="h-[300px] border border-slate-800 rounded-2xl bg-slate-950/50">
              <div className="p-2 space-y-1">
                {filteredCustomersForLink.map(c => (
                  <Button key={c.id} variant="ghost" className="w-full justify-between h-12 font-bold uppercase text-[10px] hover:bg-primary/10 rounded-lg px-4" onClick={() => handleLinkCustomer(c)}>
                    <span className="truncate">{c.name}</span>
                    {c.balance > 0 && <span className="text-[8px] text-yellow-500 font-black ml-2">R$ {c.balance.toFixed(2)}</span>}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkCustomerOpen(false)} className="h-12 font-black uppercase text-[10px] rounded-xl w-full">FECHAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!itemToCustomize} onOpenChange={(o) => !o && setItemToCustomize(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-black uppercase tracking-tight text-white text-sm">
              <Zap className="text-orange-500 h-5 w-5" /> {itemToCustomize?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {itemToCustomize?.type === 'manual' && (
              <>
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <Button 
                    type="button"
                    variant={manualType === 'debit' ? 'default' : 'ghost'} 
                    className={cn("flex-1 h-10 font-black uppercase text-[10px] rounded-lg", manualType === 'debit' && "bg-primary text-white shadow-lg")}
                    onClick={() => setManualType('debit')}
                  >
                    Débito (+)
                  </Button>
                  <Button 
                    type="button"
                    variant={manualType === 'credit' ? 'default' : 'ghost'} 
                    className={cn("flex-1 h-10 font-black uppercase text-[10px] rounded-lg", manualType === 'credit' && "bg-emerald-600 text-white shadow-lg")}
                    onClick={() => setManualType('credit')}
                  >
                    Crédito (-)
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Descrição</Label>
                  <Input value={customData.name} onChange={(e) => setCustomItemData(p => ({ ...p, name: e.target.value.toUpperCase() }))} className="h-12 font-black uppercase bg-slate-950 border-slate-800 rounded-xl" placeholder="EX: COUVERT" autoFocus />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Valor (R$)</Label>
              <Input type="number" step="0.01" value={customData.price} onChange={(e) => setCustomItemData(p => ({ ...p, price: e.target.value }))} className={cn("h-16 text-3xl font-black bg-slate-950 border-none rounded-xl text-center", manualType === 'credit' ? "text-emerald-400" : "text-primary")} placeholder="0.00" autoFocus={itemToCustomize?.type !== 'manual'} />
            </div>
            {itemToCustomize?.type === 'game' && (
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Referência</Label>
                <Input value={customData.identifier} onChange={(e) => setCustomItemData(p => ({ ...p, identifier: e.target.value }))} className="h-12 font-black uppercase bg-slate-950 border-slate-800 rounded-xl" placeholder="EX: MILHAR 1234" />
              </div>
            )}
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setItemToCustomize(null)} className="h-12 font-black uppercase text-[10px] rounded-xl">CANCELAR</Button>
            <Button onClick={handleCustomConfirm} className={cn("text-white font-black uppercase h-12 rounded-xl text-[10px]", manualType === 'credit' ? "bg-emerald-600" : "bg-primary")}>CONFIRMAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-border/40 rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-destructive font-black uppercase tracking-tight text-lg">
              <AlertTriangle size={24} /> EXCLUIR COMANDA?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-relaxed mt-2">
              Apagar permanentemente o atendimento <strong className="text-white">{existingOrder?.displayName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-2">
            <AlertDialogCancel className="h-12 font-black uppercase text-[9px] rounded-xl">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-white hover:bg-destructive/90 h-12 font-black uppercase text-[9px] rounded-xl">SIM, EXCLUIR</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isPaymentModalOpen && (<OrderPaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} order={{ id: existingOrder?.id || '', displayName: existingOrder?.displayName || '', items: currentItems, total, customerId: existingOrder?.customerId || null, createdAt: existingOrder?.createdAt }} onDeleteOrder={onDeleteOrder} onCloseAll={() => { setIsPaymentModalOpen(false); onOpenChange(false); }} />)}
    </>
  );
};