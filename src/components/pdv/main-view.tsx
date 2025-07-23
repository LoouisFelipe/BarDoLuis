'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useAuth, useCollection } from '@/lib/firebase';

import { TabComandas } from '@/components/pdv/tab-comandas';
import { TabProdutos } from '@/components/pdv/tab-produtos';
import { TabClientes } from '@/components/pdv/tab-clientes';
import { TabFinanceiro } from '@/components/pdv/tab-financeiro';
import { TabRelatorios } from '@/components/pdv/tab-relatorios';
import { TabFornecedores } from '@/components/pdv/tab-fornecedores';
import { TabVendaRapida } from '@/components/pdv/tab-venda-rapida';
import { useToast } from '@/hooks/use-toast';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/pdv/spinner';

import { GlassWater, UserCog, ClipboardList, Package, Users, History, BarChart2, Truck, Zap } from 'lucide-react';

export function MainView() {
    const [activeTab, setActiveTab] = useState('comandas');
    const { user, isAuthReady } = useAuth();
    const [userRole, setUserRole] = useState('admin');
    const { toast } = useToast();

    const { data: products, loading: productsLoading } = useCollection('products');
    const { data: customers, loading: customersLoading } = useCollection('customers');
    const { data: suppliers, loading: suppliersLoading } = useCollection('suppliers');
    const { data: transactions, loading: transactionsLoading } = useCollection('transactions');
    const { data: comandas, loading: comandasLoading } = useCollection('comandas', { where: ['status', '==', 'open'] });

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        toast({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            description: message,
            variant: type === 'error' ? 'destructive' : 'default',
        });
    }, [toast]);

    const permittedTabs = useMemo(() => {
        if (userRole === 'admin') {
            return ['comandas', 'venda_rapida', 'produtos', 'clientes', 'suppliers', 'financeiro', 'relatorios'];
        }
        return ['comandas', 'venda_rapida'];
    }, [userRole]);

    useEffect(() => {
        if (isAuthReady && !permittedTabs.includes(activeTab)) {
            setActiveTab('comandas');
        }
    }, [userRole, activeTab, permittedTabs, isAuthReady]);

    const renderTabContent = () => {
        if (!isAuthReady || !user) {
            return (
                <div className="flex flex-col justify-center items-center h-full">
                    <Spinner /> 
                    <p className="ml-4 text-foreground mt-4">Autenticando e carregando dados...</p>
                </div>
            );
        }
        
        if (!permittedTabs.includes(activeTab)) return null;

        const isLoading = productsLoading || customersLoading || suppliersLoading || transactionsLoading || comandasLoading;

        switch (activeTab) {
            case 'comandas': return <TabComandas products={products || []} customers={customers || []} comandas={comandas || []} loading={isLoading} userId={user.uid} showNotification={showNotification} />;
            case 'venda_rapida': return <TabVendaRapida products={products || []} transactions={transactions || []} loading={isLoading} userId={user.uid} showNotification={showNotification} />;
            case 'produtos': return <TabProdutos products={products || []} loading={productsLoading} userId={user.uid} allProducts={products || []} suppliers={suppliers || []} showNotification={showNotification} />;
            case 'clientes': return <TabClientes customers={customers || []} loading={customersLoading} userId={user.uid} transactions={transactions || []} showNotification={showNotification} />;
            case 'suppliers': return <TabFornecedores suppliers={suppliers || []} products={products || []} loading={suppliersLoading} userId={user.uid} showNotification={showNotification} />;
            case 'financeiro': return <TabFinanceiro transactions={transactions || []} customers={customers || []} loading={transactionsLoading} userId={user.uid} showNotification={showNotification} />;
            case 'relatorios': return <TabRelatorios transactions={transactions || []} products={products || []} loading={transactionsLoading || productsLoading} showNotification={showNotification} setActiveTab={setActiveTab} />;
            default: return null;
        }
    };

    const TabButton = ({ tabName, icon, label }: { tabName: string, icon: React.ElementType, label: string }) => (
        <button onClick={() => setActiveTab(tabName)} className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start w-full text-sm font-medium rounded-lg transition-colors duration-200 group ${activeTab === tabName ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            <div className="p-3">
                {React.createElement(icon, { className: `transition-colors ${activeTab === tabName ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`, size: 22 })}
            </div>
            <span className="hidden lg:inline font-semibold">{label}</span>
        </button>
    );

    return (
        <div className="bg-background text-foreground min-h-screen font-sans flex flex-col sm:flex-row">
            <nav className="bg-card p-2 sm:p-4 sm:w-20 lg:w-56 flex sm:flex-col justify-around sm:justify-start sm:space-y-2 transition-all duration-300">
                <div className="hidden sm:flex items-center mb-6 p-2">
                    <GlassWater className="text-primary" size={32} />
                    <h1 className="text-xl font-bold ml-3 hidden lg:block">BARDOLUIS</h1>
                </div>
                {permittedTabs.map(tab => {
                    const tabConfig: { icon: React.ElementType, label: string } | undefined = {
                        comandas: { icon: ClipboardList, label: "Comandas" },
                        venda_rapida: { icon: Zap, label: "Venda Rápida" },
                        produtos: { icon: Package, label: "Produtos" },
                        clientes: { icon: Users, label: "Clientes" },
                        suppliers: { icon: Truck, label: "Fornecedores" },
                        financeiro: { icon: History, label: "Financeiro" },
                        relatorios: { icon: BarChart2, label: "Relatórios" },
                    }[tab];
                    return tabConfig ? <TabButton key={tab} tabName={tab} icon={tabConfig.icon} label={tabConfig.label} /> : null;
                })}
                <div className="mt-auto hidden sm:block p-2">
                    {isAuthReady && (
                        <div className="p-2 bg-background rounded-lg">
                            <label className="text-xs text-muted-foreground flex items-center mb-1 hidden lg:flex"><UserCog size={14} className="mr-1" /> Perfil de Acesso</label>
                            <Select value={userRole} onValueChange={setUserRole}>
                                <SelectTrigger className="w-full bg-secondary text-foreground p-1 rounded-md text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="caixa">Caixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </nav>
            <main className="flex-1 p-2 md:p-6 bg-background overflow-y-auto">
                {renderTabContent()}
            </main>
        </div>
    );
}
