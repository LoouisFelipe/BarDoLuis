'use client';

import { Order, OrderItem, Product, DoseOption } from '@/lib/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useData } from '@/contexts/data-context';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, ShoppingCart, Save, Search, X, Receipt, ShoppingBasket } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useToast } from '@/hooks/use-toast';
import { OrderPaymentModal } from './order-payment-modal';
import { cn } from '@/lib/utils';

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
  const { products, loading: productsLoading } = useData();
  const { toast } = useToast();
  
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const displayName = existingOrder?.displayName || 'Comanda Sem Nome';

  useEffect(() => {
    if (open && existingOrder) {
      setCurrentItems(JSON.parse(JSON.stringify(existingOrder.items ?? [])));
      setIsPaymentModalOpen(false);
      setSearchTerm('');
    }
  }, [open, existingOrder]);
  
  const total = useMemo(() => currentItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [currentItems]);

  const categories = useMemo(() => {
    // CTO Rule: Guard clause to prevent crashes on undefined data.
    if (!products) {
      return [];
    }
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    // CTO Rule: Guard clause.
    if (!products) {
      return [];
    }
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || p.category === selectedCategory;
        const hasStock = p.stock > 0 || p.saleType === 'service';
        return matchesSearch && matchesCategory && hasStock;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, selectedCategory]);

  const handleUpdateQuantity = (productId: string, doseName: string | undefined | null, change: number) => {
    setCurrentItems(prevItems => {
      const newItems = [...prevItems];
      const itemIndex = newItems.findIndex(i => i.productId === productId && (i.doseName === doseName || (!i.doseName && !doseName)));
      
      if (itemIndex === -1 && change > 0) return prevItems; 
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
  
  const handleAddItem = useCallback((product: Product, dose?: DoseOption) => {
     if (!product.id) return;

     // CRITICAL: Avoid undefined values in Firestore arrays
     const newItem: OrderItem = {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: dose ? dose.price : (product.unitPrice || 0),
        ...(dose?.name ? { doseName: dose.name } : {}),
        ...(dose?.size ? { size: dose.size } : {}),
    };

    setCurrentItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(i => 
            i.productId === newItem.productId && i.doseName === newItem.doseName
        );
        
        if (existingItemIndex > -1) {
            const updated = [...prevItems];
            updated[existingItemIndex].quantity += 1;
            return updated;
        } else {
            return [...prevItems, newItem];
        }
    });

    toast({
        description: `${newItem.name} adicionado!`,
        duration: 1000,
        className: "bg-primary text-primary-foreground border-none"
    });
  }, [toast]);

  const handleSaveOrder = async () => {
    if (!existingOrder?.id) {
        toast({ title: "Erro", description: "Comanda não identificada.", variant: "destructive" });
        return;
    }
    
    setProcessing(true);
    try {
        await onUpdateOrder(existingOrder.id, currentItems);
        toast({ title: "Comanda Salva", className: "bg-green-600 text-white" });
        onOpenChange(false);
    } catch (error: any) {
        console.error("Erro ao salvar comanda:", error);
        toast({ 
            title: "Erro ao Salvar", 
            description: error.message || "Não foi possível atualizar a comanda.",
            variant: "destructive" 
        });
    } finally {
        setProcessing(false);
    }
  };

  const handleOpenPaymentModal = () => {
      setIsPaymentModalOpen(true);
  };

  if (!open) return null; 

  return (
    <>
      <Dialog open={open && !isPaymentModalOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[95vh] md:h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b bg-card flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-xl font-bold">{displayName}</DialogTitle>
                <DialogDescription className="text-xs uppercase font-bold text-muted-foreground tracking-tighter">Atendimento em Curso</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Parcial</p>
                <p className="text-2xl font-black text-primary">R$ {total.toFixed(2)}</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            <div className="flex-grow flex flex-col border-r bg-muted/10 p-4 gap-4 overflow-hidden">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar cerveja, dose, petisco..." 
                    className="pl-10 h-11 bg-card shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <Button 
                    variant={selectedCategory === null ? "default" : "outline"} 
                    size="sm" 
                    className="rounded-full text-xs font-bold whitespace-nowrap"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todos
                  </Button>
                  {categories.map(cat => (
                    <Button 
                      key={cat} 
                      variant={selectedCategory === cat ? "default" : "outline"} 
                      size="sm" 
                      className="rounded-full text-xs font-bold whitespace-nowrap"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-grow">
                {productsLoading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                    {filteredProducts.map(product => (
                      <Card key={product.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => product.saleType !== 'dose' && handleAddItem(product)}>
                        <CardContent className="p-3 flex flex-col justify-between h-full gap-2">
                          <div>
                            <p className="font-bold text-sm leading-tight mb-1">{product.name}</p>
                            <div className="flex justify-between items-center">
                              <Badge variant="secondary" className="text-[10px] h-4">{product.category}</Badge>
                              {product.saleType !== 'service' && (
                                <span className={cn(
                                  "text-[10px] font-bold",
                                  product.stock <= 5 ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  {product.stock} un.
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-primary">
                              {product.saleType === 'unit' ? `R$ ${product.unitPrice?.toFixed(2)}` : 'Doses'}
                            </span>
                            {product.saleType === 'dose' ? (
                              <Popover>
                                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full"><Plus className="h-4 w-4" /></Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-48 p-2">
                                  <div className="flex flex-col gap-1">
                                    {product.doseOptions?.filter(d => d.enabled).map(dose => (
                                      <Button key={dose.name} onClick={() => handleAddItem(product, dose)} variant="ghost" className="justify-between text-xs h-9">
                                        <span>{dose.name}</span>
                                        <span className="font-bold">R$ {dose.price.toFixed(2)}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Button size="icon" className="h-8 w-8 rounded-full"><Plus className="h-4 w-4" /></Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="w-full md:w-[400px] flex flex-col bg-card shrink-0">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> ITENS NA COMANDA ({currentItems.length})
                </h3>
              </div>
              
              <ScrollArea className="flex-grow">
                <div className="p-4 space-y-3">
                  {currentItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center gap-4">
                      <ShoppingBasket size={48} className="opacity-20" />
                      <p className="text-sm font-medium">Sacola vazia.<br/>Toque nos produtos para adicionar.</p>
                    </div>
                  ) : (
                    currentItems.map((item, idx) => (
                      <div key={`${item.productId}-${item.doseName || idx}`} className="flex items-center justify-between bg-background border rounded-lg p-2 shadow-sm">
                        <div className="flex-grow min-w-0 pr-2">
                          <p className="font-bold text-xs truncate">{item.name}</p>
                          {item.doseName && <p className="text-[10px] text-muted-foreground">Dose: {item.doseName}</p>}
                          <p className="text-[10px] font-bold text-primary">R$ {item.unitPrice.toFixed(2)} un.</p>
                        </div>
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleUpdateQuantity(item.productId, item.doseName, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-1" onClick={() => handleUpdateQuantity(item.productId, item.doseName, -item.quantity)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/20 mt-auto space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-muted-foreground uppercase">Valor Total</span>
                  <span className="text-2xl font-black text-primary">R$ {total.toFixed(2)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="secondary" 
                    className="font-bold h-12 uppercase" 
                    onClick={handleOpenPaymentModal}
                    disabled={currentItems.length === 0}
                  >
                    💲 Pagar / Fechar
                  </Button>
                  <Button 
                    onClick={handleSaveOrder} 
                    disabled={processing} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 uppercase"
                  >
                    {processing ? <Spinner size="h-4 w-4" /> : <><Save className="mr-2 h-4 w-4" /> Confirmar</>}
                  </Button>
                </div>
                <Button variant="ghost" className="w-full text-xs text-muted-foreground uppercase font-bold" onClick={() => onOpenChange(false)}>
                  Continuar Atendendo
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {isPaymentModalOpen && (
        <OrderPaymentModal 
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          order={{ id: existingOrder?.id || '', displayName, items: currentItems, total}}
          onDeleteOrder={onDeleteOrder}
          onCloseAll={() => {
            setIsPaymentModalOpen(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
};
