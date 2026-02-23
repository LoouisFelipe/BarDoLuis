'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { OrderCard, OrderCardSkeleton } from '@/components/orders/OrderCard';
import { OrderManagementModal } from '@/components/orders/order-management-modal';
import { useOpenOrders } from '@/hooks/use-open-orders';
import { PlusCircle, Search, LayoutGrid, List, ChevronRight, ShoppingBasket } from 'lucide-react';
import { NewOrderModal } from '@/components/orders/new-order-modal';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Aba de Controle Diário com Opções de Lista/Cards.
 * CTO: Implementação do ViewMode para flexibilidade no balcão. Refatorado import de skeleton.
 */
export const DailyControlTab: React.FC = () => {
    const { openOrders, loading, error, updateOrder, deleteOrder } = useOpenOrders();
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleCardClick = (order: Order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
    };
    
    const handleNewOrderSuccess = (order: Order) => {
        setIsNewModalOpen(false);
        handleCardClick(order);
    };

    const filteredOrders = useMemo(() => {
        if (loading || !openOrders) return [];
        return openOrders.filter(order =>
            order.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }, [openOrders, searchTerm, loading]);

    const renderListView = () => (
        <div className="space-y-2 pb-20">
            {filteredOrders.map(order => {
                const isOccupied = order.items.length > 0;
                return (
                    <Card 
                        key={order.id} 
                        className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-all border-l-4",
                            isOccupied ? "border-l-primary bg-primary/5" : "border-l-transparent bg-card"
                        )}
                        onClick={() => handleCardClick(order)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    isOccupied ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <ShoppingBasket size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-base">{order.displayName}</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                        {isOccupied ? `${order.items.length} itens no pedido` : 'Comanda vazia'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className={cn("text-lg font-black", isOccupied ? "text-foreground" : "text-muted-foreground opacity-40")}>
                                        R$ {(order.total || 0).toFixed(2)}
                                    </p>
                                </div>
                                <ChevronRight size={20} className="text-muted-foreground opacity-40" />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <OrderCardSkeleton key={index} />
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex justify-center items-center h-full text-red-500">
                    <p>Erro ao carregar as comandas: {error.message}</p>
                </div>
            );
        }
        
        if ((openOrders?.length ?? 0) > 0 && filteredOrders.length === 0 && searchTerm) {
             return (
                 <div className="flex flex-col items-center justify-center flex-grow min-h-[300px] border-2 border-dashed rounded-xl bg-muted/20">
                    <p className="text-muted-foreground font-medium text-center p-4">Nenhuma comanda encontrada para &quot;{searchTerm}&quot;</p>
                 </div>
            );
        }

        if (filteredOrders.length > 0) {
            return viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            displayName={order.displayName}
                            order={order}
                            onClick={() => handleCardClick(order)}
                        />
                    ))}
                </div>
            ) : renderListView();
        }

        return (
            <div className="flex flex-col items-center justify-center flex-grow min-h-[300px] border-2 border-dashed rounded-xl bg-muted/20">
                <div className="text-center p-6 space-y-4">
                    <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-semibold text-foreground">Inicie o movimento!</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Clique no botão acima para criar a primeira comanda do dia.</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="p-1 md:p-4 h-full flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-4 w-full md:max-w-2xl">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar comanda (Mesa, Nome...)" 
                                className="pl-10 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg shrink-0">
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('grid')}
                                className="h-9 w-9"
                            >
                                <LayoutGrid size={18} />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                                size="icon" 
                                onClick={() => setViewMode('list')}
                                className="h-9 w-9"
                            >
                                <List size={18} />
                            </Button>
                        </div>
                    </div>
                    <Button onClick={() => setIsNewModalOpen(true)} className="w-full md:w-auto font-bold gap-2 h-11" disabled={loading}>
                        <PlusCircle className="h-5 w-5" />
                        Nova Comanda
                    </Button>
                </div>
                
                {renderContent()}
            </div>

            {isEditModalOpen && selectedOrder && (
                <OrderManagementModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    existingOrder={selectedOrder}
                    onUpdateOrder={updateOrder}
                    onDeleteOrder={deleteOrder}
                />
            )}
            
            {isNewModalOpen && (
                <NewOrderModal
                    open={isNewModalOpen}
                    onOpenChange={setIsNewModalOpen}
                    onSuccess={handleNewOrderSuccess}
                />
            )}
        </>
    );
};
