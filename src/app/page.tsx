
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useAuth, useCollection } from '@/lib/firebase';

import { TabComandas } from '@/components/pdv/tab-comandas';
import { TabProdutos } from '@/components/pdv/tab-produtos';
import { TabClientes } from '@/components/pdv/tab-clientes';
import { TabFinanceiro } from '@/components/pdv/tab-financeiro';
import { TabRelatorios } from '@/components/pdv/tab-relatorios';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/pdv/spinner';

import { GlassWater, UserCog, ClipboardList, Package, Users, History, BarChart2 } from 'lucide-react';

export default function App() {
    const [activeTab, setActiveTab] = useState('comandas');
    const { user, isAuthReady } = useAuth();
    const [userRole, setUserRole] = useState('admin'); 
    
    const { data: products, loading: productsLoading } = useCollection('products');
    const { data: customers, loading: customersLoading } = useCollection('customers');
    const { data: transactions, loading: transactionsLoading } = useCollection('transactions');

    const permittedTabs = useMemo(() => {
        if (userRole === 'admin') {
            return ['comandas', 'produtos', 'clientes', 'financeiro', 'relatorios'];
        }
        return ['comandas', 'produtos'];
    }, [userRole]);

    useEffect(() => {
        if (isAuthReady && !permittedTabs.includes(activeTab)) {
            setActiveTab('comandas');
        }
    }, [userRole, activeTab, permittedTabs, isAuthReady]);

    const renderTabContent = () => {
        if (!isAuthReady || !user) {
            return (
                <div className="flex justify-center items-center h-full">
                    <Spinner /> 
                    <p className="ml-4 text-white">Autenticando...</p>
                </div>
            );
        }
        
        if (!permittedTabs.includes(activeTab)) return null;

        switch (activeTab) {
            case 'comandas': return <TabComandas products={products} customers={customers} userId={user.uid} />;
            case 'produtos': return <TabProdutos products={products} loading={productsLoading} userId={user.uid} allProducts={products} />;
            case 'clientes': return <TabClientes customers={customers} loading={customersLoading} userId={user.uid} transactions={transactions} />;
            case 'financeiro': return <TabFinanceiro transactions={transactions} customers={customers} userId={user.uid} />;
            case 'relatorios': return <TabRelatorios transactions={transactions} products={products} loading={transactionsLoading || productsLoading} />;
            default: return null;
        }
    };

    const TabButton = ({ tabName, icon, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start sm:px-4 py-3 w-full text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === tabName ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            {React.createElement(icon, { className: "mb-1 sm:mb-0 sm:mr-3", size: 20 })}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <div className="bg-background text-foreground min-h-screen font-sans flex flex-col md:flex-row">
            <nav className="bg-card p-2 md:p-4 md:w-48 lg:w-56 flex md:flex-col justify-around md:justify-start md:space-y-2">
                <div className="hidden md:flex items-center mb-4">
                    <GlassWater className="text-accent mr-2" size={32} />
                    <h1 className="text-xl font-bold">Boteco PDV</h1>
                </div>
                <div className="hidden md:block p-2 bg-background rounded-lg mb-4">
                    {isAuthReady && (
                        <>
                            <label className="text-xs text-muted-foreground flex items-center mb-1"><UserCog size={14} className="mr-1"/> Perfil</label>
                            <Select value={userRole} onValueChange={setUserRole}>
                                <SelectTrigger className="w-full bg-secondary text-foreground p-1 rounded-md text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="caixa">Caixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    )}
                </div>
                {permittedTabs.map(tab => {
                    const tabConfig = {
                        comandas: { icon: ClipboardList, label: "Comandas" },
                        produtos: { icon: Package, label: "Produtos" },
                        clientes: { icon: Users, label: "Clientes" },
                        financeiro: { icon: History, label: "Financeiro" },
                        relatorios: { icon: BarChart2, label: "Relatórios & IA" },
                    }[tab];
                    return tabConfig ? <TabButton key={tab} tabName={tab} icon={tabConfig.icon} label={tabConfig.label} /> : null;
                })}
            </nav>
            <main className="flex-1 p-2 md:p-6">
                {renderTabContent()}
            </main>
        </div>
    );
}
