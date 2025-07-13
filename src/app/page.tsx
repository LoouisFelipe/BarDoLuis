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
import { Toaster, useToast } from '@/components/ui/toaster';
import { toast as toaster } from '@/hooks/use-toast';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/pdv/spinner';
import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport, ToastProvider } from '@/components/ui/toast';

import { GlassWater, UserCog, ClipboardList, Package, Users, History, BarChart2, Truck, Zap, CheckCircle, XCircle, Info } from 'lucide-react';

export default function App() {
    const [activeTab, setActiveTab] = useState('comandas');
    const { user, isAuthReady } = useAuth();
    const [userRole, setUserRole] = useState('admin');
    const [notifications, setNotifications] = useState([]);

    const { data: products, loading: productsLoading } = useCollection('products');
    const { data: customers, loading: customersLoading } = useCollection('customers');
    const { data: suppliers, loading: suppliersLoading } = useCollection('suppliers');
    const { data: transactions, loading: transactionsLoading } = useCollection('transactions');

    const showNotification = useCallback((message, type = 'info') => {
        toaster({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            description: message,
            variant: type === 'error' ? 'destructive' : 'default',
        });
    }, []);

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

        const allData = {
            products: products || [],
            customers: customers || [],
            suppliers: suppliers || [],
            transactions: transactions || [],
            loading: productsLoading || customersLoading || suppliersLoading || transactionsLoading,
        };

        switch (activeTab) {
            case 'comandas': return <TabComandas products={allData.products} customers={allData.customers} userId={user.uid} showNotification={showNotification} />;
            case 'venda_rapida': return <TabVendaRapida products={allData.products} transactions={allData.transactions} userId={user.uid} showNotification={showNotification} />;
            case 'produtos': return <TabProdutos products={allData.products} loading={allData.loading} userId={user.uid} allProducts={allData.products} suppliers={allData.suppliers} showNotification={showNotification} />;
            case 'clientes': return <TabClientes customers={allData.customers} loading={allData.loading} userId={user.uid} transactions={allData.transactions} showNotification={showNotification} />;
            case 'suppliers': return <TabFornecedores suppliers={allData.suppliers} products={allData.products} loading={allData.loading} userId={user.uid} showNotification={showNotification} />;
            case 'financeiro': return <TabFinanceiro transactions={allData.transactions} customers={allData.customers} userId={user.uid} showNotification={showNotification} />;
            case 'relatorios': return <TabRelatorios transactions={allData.transactions} products={allData.products} loading={allData.loading} showNotification={showNotification} setActiveTab={setActiveTab} />;
            default: return null;
        }
    };

    const TabButton = ({ tabName, icon, label }) => (
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
                    const tabConfig = {
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