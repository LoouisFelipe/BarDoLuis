'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderCardSkeleton } from '@/components/orders/OrderCardSkeleton';
import { OrderManagementModal } from '@/components/orders/order-management-modal';
import { useOpenOrders } from '@/hooks/use-open-orders';
import { PlusCircle, Search } from 'lucide-react';
import { NewOrderModal } from '@/components/orders/new-order-modal';
import { Input } from '@/components/ui/input';

export const DailyControlTab: React.FC = () => {
    const { openOrders, loading, error, updateOrder, deleteOrder } = useOpenOrders();
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
            return (
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
            );
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
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar comanda (Mesa, Nome...)" 
                            className="pl-10 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                        />
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
