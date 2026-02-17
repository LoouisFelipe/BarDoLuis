
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CockpitTab } from '@/components/dashboard/tabs/cockpit-tab';
import { DailyControlTab } from '@/components/dashboard/tabs/daily-control-tab';
import { FinancialsTab } from '@/components/dashboard/tabs/financials-tab';
import { ProductsTab } from '@/components/dashboard/tabs/products-tab';
import { CustomersTab } from '@/components/dashboard/tabs/customers-tab';
import { SuppliersTab } from '@/components/dashboard/tabs/suppliers-tab';
import { UsersTab } from '@/components/dashboard/tabs/users-tab';
import { SettingsTab } from '@/components/dashboard/tabs/settings-tab';
import { BarChart2, ShoppingBasket, DollarSign, Package, Users as UsersIcon, Truck, Shield, Settings as SettingsIcon } from 'lucide-react';
import React, { Suspense, useMemo, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useData } from '@/contexts/data-context';
import { useOpenOrders } from '@/hooks/use-open-orders';

const TABS_CONFIG = {
  cockpit: {
    label: 'B.I. Cockpit',
    icon: BarChart2,
    component: <CockpitTab />,
    permission: 'public',
  },
  daily: {
    label: 'Controle Diário',
    icon: ShoppingBasket,
    component: <DailyControlTab />,
    permission: 'public',
  },
  financials: {
    label: 'Financeiro',
    icon: DollarSign,
    component: <FinancialsTab />,
    permission: 'cashier',
  },
  products: {
    label: 'Produtos',
    icon: Package,
    component: <ProductsTab />,
    permission: 'admin',
  },
  customers: {
    label: 'Clientes',
    icon: UsersIcon,
    component: <CustomersTab />,
    permission: 'public',
  },
  suppliers: {
    label: 'Fornecedores',
    icon: Truck,
    component: <SuppliersTab />,
    permission: 'admin',
  },
  users: {
    label: 'Usuários',
    icon: Shield,
    component: <UsersTab />,
    permission: 'admin',
  },
  settings: {
    label: 'Ajustes',
    icon: SettingsIcon,
    component: <SettingsTab />,
    permission: 'admin',
  },
};

type TabName = keyof typeof TABS_CONFIG;

const DashboardLayoutContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAdmin, isCaixaOrAdmin, isAuthReady } = useAuth();
    const { products, customers } = useData();
    const { openOrders } = useOpenOrders();

    const stats = useMemo(() => {
        const lowStockCount = products.filter(p => p.saleType !== 'service' && p.stock <= (p.lowStockThreshold || 0)).length;
        const activeOrdersCount = openOrders.length;
        const debtorsCount = customers.filter(c => (c.balance || 0) > 0).length;
        
        return {
            products: lowStockCount > 0 ? lowStockCount : null,
            daily: activeOrdersCount > 0 ? activeOrdersCount : null,
            customers: debtorsCount > 0 ? debtorsCount : null,
        };
    }, [products, openOrders, customers]);

    const availableTabs = useMemo(() => {
        return Object.entries(TABS_CONFIG).filter(([_, tab]) => {
            if (tab.permission === 'public') return true;
            if (tab.permission === 'cashier') return isCaixaOrAdmin;
            if (tab.permission === 'admin') return isAdmin;
            return false;
        });
    }, [isAdmin, isCaixaOrAdmin]);

    const activeTab = (searchParams.get('tab') as TabName) || 'cockpit';
    
    useEffect(() => {
        if (!isAuthReady) return;
        const isTabAvailable = availableTabs.some(([key]) => key === activeTab);
        if (!isTabAvailable) {
            router.replace('/?tab=cockpit');
        }
    }, [activeTab, availableTabs, router, isAuthReady]);

    const handleTabChange = (value: string) => {
        router.push(`/?tab=${value}`, { scroll: false });
    };
    
    return (
        <main className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6 bg-muted/20 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
                {/* CPO: ScrollArea permite navegação por abas infinita no mobile sem quebrar o layout */}
                <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-card p-1 shrink-0">
                    <TabsList className="flex w-max space-x-1 bg-transparent h-auto">
                        {availableTabs.map(([key, tab]) => {
                            const badge = stats[key as keyof typeof stats];
                            return (
                                <TabsTrigger 
                                    key={key} 
                                    value={key} 
                                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative transition-all rounded-md"
                                >
                                    <tab.icon size={18} />
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">{tab.label}</span>
                                    {badge && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-card animate-in fade-in zoom-in">
                                            {badge}
                                        </span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                    <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
                
                <div className="flex-1 mt-4 overflow-hidden">
                    {availableTabs.map(([key, tab]) => (
                        <TabsContent key={key} value={key} className="h-full mt-0 focus-visible:outline-none overflow-y-auto scrollbar-hide pb-20 md:pb-0">
                            {tab.component}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </main>
    );
};

export const DashboardLayout: React.FC = () => (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner size="h-12 w-12"/></div>}>
        <DashboardLayoutContent />
    </Suspense>
);
