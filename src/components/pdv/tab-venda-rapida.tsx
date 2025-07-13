
'use client';
import React, { useState, useMemo } from 'react';
import { getDb, appId, writeBatch, doc, getDoc, collection } from '@/lib/firebase';
import { Spinner } from './spinner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export const TabVendaRapida = ({ products, transactions, loading, userId, showNotification }) => {
    const [comanda, setComanda] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [processing, setProcessing] = useState(false);

    const mostSoldProducts = useMemo(() => {
        if (!transactions || transactions.length === 0) return products.slice(0, 8).filter(p => p && p.saleType === 'unit');

        const productCount = transactions
            .filter(t => t.type === 'sale')
            .flatMap(t => t.items)
            .reduce((acc, item) => {
                acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
                return acc;
            }, {});

        return Object.entries(productCount)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 8)
            .map(([productId]) => products.find(p => p.id === productId))
            .filter(p => p && p.saleType === 'unit');
    }, [transactions, products]);

    const total = useMemo(() => comanda.reduce((sum, item) => sum + item.price * item.quantity, 0), [comanda]);

    const addProductToComanda = (product) => {
        if (product.stock <= 0) {
            showNotification(`Produto "${product.name}" está esgotado.`, 'error');
            return;
        }
        setComanda(prev => {
            const existingItem = prev.find(i => i.productId === product.id);
            if (existingItem) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: product.unitPrice,
                quantity: 1,
                type: 'unit'
            }];
        });
    };

    const handleFinalizeSale = async () => {
        const db = getDb();
        if (!db || comanda.length === 0) {
            showNotification("Adicione itens antes de fechar a venda.", "error");
            return;
        }
        setProcessing(true);
        try {
            const batch = writeBatch(db);
            const saleDocData = {
                timestamp: new Date(),
                items: comanda,
                subtotal: total,
                discount: 0,
                surcharge: 0,
                total: total,
                paymentMethod,
                comandaName: `Venda Rápida - ${new Date().toLocaleString('pt-BR')}`,
                type: 'sale'
            };
            batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/transactions`)), saleDocData);

            for (const item of comanda) {
                const productRef = doc(db, `artifacts/${appId}/users/${userId}/products`, item.productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const currentStock = productDoc.data().stock || 0;
                    batch.update(productRef, { stock: currentStock - item.quantity });
                }
            }

            await batch.commit();
            showNotification("Venda rápida finalizada com sucesso!", "success");
            setComanda([]);
        } catch (error) {
            console.error("Erro ao finalizar venda rápida:", error);
            showNotification("Erro ao finalizar a venda.", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-foreground mb-4 flex items-center"><Zap className="mr-3 text-yellow-400"/> Venda Rápida</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Atalhos (Mais Vendidos)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {mostSoldProducts.map(p => (
                                <Button key={p.id} onClick={() => addProductToComanda(p)} className="h-20 text-base" variant="secondary">
                                    {p.name}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 bg-card p-4 rounded-xl flex flex-col">
                <h3 className="font-semibold text-xl text-foreground mb-3">Comanda Atual</h3>
                <div className="flex-grow bg-background rounded-lg p-2 mb-4 overflow-y-auto min-h-[200px]">
                    {comanda.length === 0 ? (
                        <p className="text-muted-foreground text-center mt-8">Adicione produtos...</p>
                    ) : (
                        <ul className="space-y-2">
                            {comanda.map((item, index) => (
                                <li key={index} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                                    <div>
                                        <p className="font-semibold text-foreground">{item.quantity}x {item.name}</p>
                                    </div>
                                    <p className="text-foreground font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="border-t-2 border-border pt-4">
                    <div className="flex justify-between items-center text-2xl font-bold text-foreground mb-4">
                        <span>Total:</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="mb-4">
                        <label className="block text-muted-foreground mb-2 text-sm">Forma de Pagamento:</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="Débito">Débito</SelectItem>
                                <SelectItem value="Crédito">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleFinalizeSale} disabled={processing || comanda.length === 0} className="w-full bg-green-600 text-white font-bold py-3 text-lg hover:bg-green-500 disabled:bg-muted-foreground">
                        {processing ? <Spinner /> : 'Finalizar Venda'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
