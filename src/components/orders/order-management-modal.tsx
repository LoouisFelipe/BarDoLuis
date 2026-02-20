'use client';

import { Order, OrderItem, Product, DoseOption, Customer, GameModality } from '@/lib/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useData } from '@/contexts/data-context';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, ShoppingCart, Save, Search, X, Receipt, ShoppingBasket, UserPlus, Users, AlertTriangle, Menu, Sparkles, Hash, Dices, UserCheck, Package, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useToast } from '@/hooks/use-toast';
import { OrderPaymentModal } from './order-payment-modal';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface OrderManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrder: Order;
  onUpdateOrder: (orderId: string, items: OrderItem[]) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

/**
 * @fileOverview Gestão de Comanda (PDV Alta Fidelidade).
 * CTO: UX Replicada com Grid de Categorias e suporte a Modo Lista/Cards.
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    const cats = new Set([...products.map(p => p.category), "ENTRETENIMENTO"]);
    return Array.from(cats).sort();
  }, [products]);

  const allItems = useMemo(() => {
    const p = products.map(prod => ({ ...prod, type: 'product' as const }));
    const g = gameModalities.map(game => ({ ...game, type: 'game' as const, saleType: 'game' as const, stock: null }));
    return [...p, ...g];
  }, [products, gameModalities]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || item.category.toUpperCase() === selectedCategory.toUpperCase() || (selectedCategory === "ENTRETENIMENTO" && item.type === 'game');
        return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems, searchTerm, selectedCategory]);

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

  const renderItemRow = (item: any) => (
    <div 
      key={item.id} 
      className="flex items-center justify-between p-5 bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer rounded-2xl border-2 border-transparent hover:border-primary/30 group animate-in fade-in slide-in-from-bottom-2"
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
      <div className="flex items-center gap-5">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
              {item.saleType === 'game' ? <Dices size={28} /> : <Package size={28} />}
          </div>
          <div className="min-w-0">
              <p className="font-black text-lg leading-tight truncate uppercase tracking-tight">{item.name}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mt-1">{item.category}</p>
          </div>
      </div>
      <div className="flex items-center gap-8">
          <div className="text-right">
              <p className="font-black text-xl text-primary tracking-tighter">
                  {item.saleType !== 'dose' && item.saleType !== 'service' ? `R$ ${item.unitPrice?.toFixed(2)}` : item.saleType === 'service' ? 'VALOR ABERTO' : 'VÁRIAS DOSES'}
              </p>
              {item.saleType !== 'service' && item.saleType !== 'game' && (
                  <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">
                      {item.stock} {item.saleType === 'dose' ? 'ML' : 'UN.'} EM ESTOQUE
                  </span>
              )}
          </div>
          {item.saleType === 'dose' ? (
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}><Button size="icon" variant="outline" className="h-14 w-14 rounded-2xl border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-xl"><Plus className="h-8 w-8" /></Button></PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-4 shadow-2xl bg-slate-900 border-slate-800 rounded-3xl">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 px-2">Selecione a Dose</p>
                  {item.doseOptions?.filter((d: any) => d.enabled).map((dose: any) => (
                    <Button key={dose.name} onClick={() => handleAddItem(item, dose)} variant="ghost" className="justify-between text-sm h-14 font-black uppercase hover:bg-primary/10 hover:text-primary rounded-xl">
                      <span>{dose.name}</span><span className="text-primary font-black">R$ {dose.price.toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-primary/5 border-2 border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
              <Plus className="h-8 w-8" />
            </div>
          )}
      </div>
    </div>
  );

  const productListContent = (
    <div className="flex-grow flex flex-col p-4 sm:p-8 gap-8 overflow-hidden h-full">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
            <div className="relative group flex-grow">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Buscar item..." 
                    className="pl-14 h-16 bg-slate-900/50 border-none shadow-inner text-xl font-bold rounded-2xl focus-visible:ring-primary/20 placeholder:text-muted-foreground/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 shrink-0 h-16">
                <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setViewMode('grid')}
                    className="h-12 w-12 rounded-lg"
                >
                    <LayoutGrid size={22} />
                </Button>
                <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setViewMode('list')}
                    className="h-12 w-12 rounded-lg"
                >
                    <List size={22} />
                </Button>
            </div>
        </div>
        
        {(selectedCategory || searchTerm) && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] font-black uppercase text-primary gap-1 h-9 px-4 border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-full"
              onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
            >
              <X size={14} /> Voltar
            </Button>
            {selectedCategory && (
              <Badge className="h-9 rounded-full px-5 font-black uppercase tracking-widest text-[9px] bg-primary text-white border-none shadow-lg shadow-primary/20">
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
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pb-24 pr-4">
                {categories.map(cat => (
                <Card 
                    key={cat} 
                    className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all active:scale-95 bg-slate-900/40 border-2 border-slate-800 shadow-xl relative overflow-hidden group"
                    onClick={() => setSelectedCategory(cat)}
                >
                    <div className="p-6 bg-primary/10 rounded-3xl mb-5 group-hover:bg-primary/20 transition-all duration-300 shadow-2xl shadow-primary/5 group-hover:scale-110">
                    <Package size={48} className="text-primary" />
                    </div>
                    <span className="font-black text-xs uppercase text-center px-4 tracking-[0.25em] text-foreground/90">{cat}</span>
                    <ChevronRight className="absolute right-4 bottom-4 h-5 w-5 text-primary/30 group-hover:text-primary transition-colors" />
                </Card>
                ))}
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3 pb-24 pr-4">
                {categories.map(cat => {
                    const itemsInCategory = allItems.filter(i => i.category === cat || (cat === "ENTRETENIMENTO" && i.type === 'game'));
                    if (itemsInCategory.length === 0) return null;
                    return (
                        <AccordionItem key={cat} value={cat} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl px-0 border-b-0">
                            <AccordionTrigger className="px-8 hover:no-underline hover:bg-slate-900/60 h-20">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <Package size={24} />
                                    </div>
                                    <span className="font-black uppercase text-sm tracking-[0.2em]">{cat}</span>
                                    <Badge variant="secondary" className="ml-2 text-[10px] font-black bg-slate-800 text-slate-400 border-none">{itemsInCategory.length} Itens</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0 border-t border-slate-800/50">
                                <div className="flex flex-col gap-2 mt-4">
                                    {itemsInCategory.map(item => renderItemRow(item))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
          )
        ) : (
          <div className="flex flex-col gap-3 pb-24 pr-4">
            {filteredItems.map(item => renderItemRow(item))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-32 text-center opacity-20 italic flex flex-col items-center gap-8">
                <Search size={80} strokeWidth={1} />
                <p className="text-lg font-black uppercase tracking-[0.3em]">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const cartContent = (
    <div className="w-full flex flex-col bg-slate-950/40 backdrop-blur-xl h-full border-l border-slate-800/50">
      <div className="p-8 border-b border-slate-800/50 flex justify-between items-center shrink-0 h-24">
        <h3 className="text-xs font-black flex items-center gap-4 uppercase tracking-[0.25em]"><ShoppingCart className="h-6 w-6 text-primary" /> SACOLA ({currentItems.length})</h3>
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all" 
            onClick={() => setIsDeleteAlertOpen(true)}
          >
            <Trash2 className="h-6 w-6" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-6 space-y-4 pb-24">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-muted-foreground text-center gap-8 opacity-10">
              <ShoppingBasket size={100} strokeWidth={1} /><p className="text-lg font-black uppercase tracking-[0.25em]">Sua sacola está vazia</p>
            </div>
          ) : (
            currentItems.map((item, idx) => (
              <div key={`${item.productId}-${item.doseName || idx}-${item.identifier || ''}`} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-2xl transition-all hover:border-primary/40 group animate-in zoom-in-95 duration-200">
                <div className="flex-grow min-w-0 pr-4">
                  <p className="font-black text-base truncate uppercase tracking-tight text-foreground">{item.name}</p>
                  {item.doseName && <p className="text-[10px] text-primary font-black uppercase mt-1 tracking-widest">{item.doseName}</p>}
                  {item.identifier && <p className="text-[10px] text-orange-500 font-black uppercase flex items-center gap-1.5 mt-1 tracking-widest"><Hash size={10}/> REF: {item.identifier}</p>}
                  <p className="text-[11px] font-bold text-muted-foreground mt-2 opacity-60">R$ {item.unitPrice.toFixed(2)} / UN.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-950/50 rounded-2xl p-1.5 shadow-inner border border-slate-800">
                    {!item.identifier ? (
                        <>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-900 transition-all" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -1, item.identifier)}><Minus className="h-5 w-5" /></Button>
                            <span className="w-10 text-center text-lg font-black">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-900 transition-all" onClick={() => handleUpdateQuantity(item.productId, item.doseName, 1, item.identifier)}><Plus className="h-5 w-5" /></Button>
                        </>
                    ) : <span className="w-12 text-center text-sm font-black bg-primary/10 text-primary py-2.5 rounded-xl border border-primary/20">1x</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-colors" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -item.quantity, item.identifier)}><Trash2 size={22} /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-8 border-t border-slate-800/50 bg-slate-950 mt-auto space-y-8 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[40px]">
        <div className="flex justify-between items-end px-4">
          <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Acumulado</span>
          <span className="text-5xl font-black text-primary tracking-tighter shadow-primary/20 drop-shadow-2xl">R$ {total.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Button variant="outline" className="font-black h-20 uppercase text-xs border-2 border-slate-800 tracking-[0.2em] hover:bg-primary/5 active:scale-95 transition-all rounded-2xl" onClick={() => setIsPaymentModalOpen(true)} disabled={currentItems.length === 0}>💲 RECEBER</Button>
          <Button onClick={handleSaveOrder} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white font-black h-20 uppercase text-xs shadow-2xl active:scale-95 transition-all tracking-[0.2em] rounded-2xl">
            {processing ? <Spinner size="h-8 w-8" /> : <><Save className="mr-3 h-6 w-6" /> SALVAR</>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <TooltipProvider>
        <Dialog open={open && !isPaymentModalOpen && !isLinkCustomerOpen && !isDeleteAlertOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[98vw] sm:max-w-[1400px] h-[96vh] flex flex-col p-0 overflow-hidden bg-slate-950 border-none shadow-2xl rounded-[40px]">
            <DialogHeader className="p-8 border-b border-slate-800/50 bg-slate-900/20 flex flex-row items-center justify-between shrink-0 h-28 relative">
                <div className="flex items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-[24px] border border-primary/20 shadow-2xl shadow-primary/10">
                    <Receipt className="h-10 w-10 text-primary" />
                </div>
                <div className="flex flex-col">
                    <DialogTitle className="text-3xl font-black uppercase tracking-tight text-white truncate max-w-[250px] md:max-w-xl">{existingOrder?.displayName || 'COMANDA'}</DialogTitle>
                    <div className="flex items-center gap-4 mt-2">
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            linkedCustomer ? "bg-primary text-white" : "bg-slate-800 text-muted-foreground"
                        )}>
                            <UserCheck size={12} /> {linkedCustomer ? `FIEL: ${linkedCustomer.name}` : 'AVULSO'}
                        </div>
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase text-primary flex items-center gap-2 hover:no-underline hover:brightness-125 transition-all" onClick={() => setIsLinkCustomerOpen(true)}>
                            <UserPlus size={14} /> {linkedCustomer ? 'TROCAR' : 'VINCULAR FIEL'}
                        </Button>
                    </div>
                </div>
                </div>
                
                <div className="text-right hidden md:flex flex-col items-end gap-1 pr-8">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">Total Acumulado</p>
                <p className="text-5xl font-black text-primary tracking-tighter leading-none drop-shadow-lg">R$ {total.toFixed(2)}</p>
                </div>

                <DialogDescription className="sr-only">Painel de controle de vendas e atendimento BarDoLuis.</DialogDescription>
            </DialogHeader>

            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="flex flex-col h-full lg:hidden">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-900/40 rounded-none h-20 border-b border-slate-800/50 p-0">
                        <TabsTrigger value="menu" className="gap-4 font-black uppercase text-[11px] tracking-[0.2em] h-full data-[state=active]:text-primary data-[state=active]:bg-primary/5 transition-all"><Menu size={24}/> CARDÁPIO</TabsTrigger>
                        <TabsTrigger value="cart" className="gap-4 font-black uppercase text-[11px] tracking-[0.2em] h-full relative data-[state=active]:text-primary data-[state=active]:bg-primary/5 transition-all">
                            <ShoppingCart size={24}/> SACOLA {currentItems.length > 0 && <span className="ml-2 px-3 py-1 bg-primary text-white rounded-full text-[10px] shadow-lg shadow-primary/20">{currentItems.length}</span>}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="menu" className="flex-grow overflow-hidden mt-0">{productListContent}</TabsContent>
                    <TabsContent value="cart" className="flex-grow overflow-hidden mt-0">{cartContent}</TabsContent>
                </Tabs>
                </div>
                <div className="hidden lg:flex h-full overflow-hidden">
                    <div className="flex-grow border-r border-slate-800/50 bg-slate-950/20 overflow-hidden">{productListContent}</div>
                    <div className="w-[520px] shrink-0">{cartContent}</div>
                </div>
            </div>
            </DialogContent>
        </Dialog>
      </TooltipProvider>
      
      {/* Modais Secundários */}
      <Dialog open={isLinkCustomerOpen} onOpenChange={setIsLinkCustomerOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 shadow-2xl rounded-3xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-4 font-black uppercase tracking-tight text-white"><Users className="text-primary h-6 w-6" /> VINCULAR FIEL</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Sincronização de histórico de consumo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-8">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                    <Input 
                        placeholder="Pesquisar por nome..." 
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-14 h-16 bg-slate-950 border-2 border-slate-800 font-bold rounded-2xl focus-visible:ring-primary/20"
                        autoFocus
                    />
                </div>
                <ScrollArea className="h-[400px] border border-slate-800 rounded-3xl bg-slate-950/50 shadow-inner">
                    <div className="p-4 space-y-2">
                        {filteredCustomersForLink.map(c => (
                            <Button 
                                key={c.id} 
                                variant="ghost" 
                                className="w-full justify-between h-16 font-black uppercase text-xs hover:bg-primary/10 hover:text-primary rounded-2xl transition-all border border-transparent hover:border-primary/20 px-6"
                                onClick={() => handleLinkCustomer(c)}
                            >
                                <span className="truncate pr-4">{c.name}</span>
                                {c.balance > 0 && <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/20 bg-yellow-500/5 px-3 py-1 font-black">R$ {c.balance.toFixed(2)}</Badge>}
                            </Button>
                        ))}
                        {filteredCustomersForLink.length === 0 && (
                            <div className="text-center py-24 text-muted-foreground text-[10px] font-black uppercase opacity-20 tracking-[0.2em]">Nenhum fiel encontrado</div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsLinkCustomerOpen(false)} className="h-14 font-black uppercase text-[10px] tracking-widest rounded-xl">CANCELAR</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToCustomize} onOpenChange={(o) => !o && setItemToCustomize(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 shadow-2xl rounded-3xl">
            <DialogHeader><DialogTitle className="flex items-center gap-4 font-black uppercase tracking-tight text-white"><Dices className="text-orange-500 h-6 w-6" /> {itemToCustomize?.name}</DialogTitle></DialogHeader>
            <div className="space-y-8 py-8">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Valor do Registro (R$)</Label>
                    <Input type="number" step="0.01" value={customData.price} onChange={(e) => setCustomItemData(p => ({ ...p, price: e.target.value }))} className="h-20 text-4xl font-black text-primary bg-slate-950 border-none shadow-inner rounded-2xl" placeholder="0.00" autoFocus />
                </div>
                {itemToCustomize?.type === 'game' && (
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Referência / Milhar / Máquina</Label>
                        <Input value={customData.identifier} onChange={(e) => setCustomItemData(p => ({ ...p, identifier: e.target.value }))} className="h-16 font-black uppercase bg-slate-950 border-2 border-slate-800 rounded-2xl tracking-widest" placeholder="EX: MILHAR 1234..." />
                    </div>
                )}
            </div>
            <DialogFooter className="gap-3"><Button variant="ghost" onClick={() => setItemToCustomize(null)} className="h-16 font-black uppercase text-[10px] tracking-widest rounded-2xl">CANCELAR</Button><Button onClick={handleCustomConfirm} className="bg-primary text-white font-black uppercase h-16 px-10 shadow-2xl shadow-primary/20 rounded-2xl tracking-widest">CONFIRMAR REGISTRO</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-2 border-slate-800 shadow-2xl rounded-[40px] p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-4 text-destructive font-black uppercase tracking-tight text-2xl">
              <AlertTriangle size={32} /> EXCLUIR ATENDIMENTO?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold uppercase text-muted-foreground leading-relaxed mt-4 tracking-tight">
              Você está prestes a apagar permanentemente a comanda <strong className="text-white">{existingOrder?.displayName}</strong>. Esta ação é irreversível e todos os lançamentos acumulados serão anulados no B.I.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="h-16 font-black uppercase text-[11px] border-2 border-slate-800 rounded-2xl tracking-widest">CANCELAR</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrder} 
              className="bg-destructive text-white hover:bg-destructive/90 h-16 font-black uppercase text-[11px] shadow-2xl shadow-destructive/20 px-12 rounded-2xl tracking-widest"
            >
              SIM, EXCLUIR COMANDA
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