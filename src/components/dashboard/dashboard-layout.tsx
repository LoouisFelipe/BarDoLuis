
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
    component: <SettingsTab showNotification={() => {}} />,
    permission: 'admin',
  },
};

type TabName = keyof typeof TABS_CONFIG;

const DashboardLayoutContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAdmin, isCaixaOrAdmin } = useAuth();

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
        const isTabAvailable = availableTabs.some(([key]) => key === activeTab);
        if (!isTabAvailable) {
            router.replace('/?tab=cockpit');
        }
    }, [activeTab, availableTabs, router]);

    const handleTabChange = (value: string) => {
        router.push(`/?tab=${value}`, { scroll: false });
    };
    
    const isTabAvailable = availableTabs.some(([key]) => key === activeTab);
    if (!isTabAvailable) {
        return <div className="flex items-center justify-center h-full"><Spinner size="h-12 w-12"/></div>;
    }

    return (
        <main className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-6 bg-muted/20 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-1">
                    {availableTabs.map(([key, tab]) => (
                        <TabsTrigger key={key} value={key} className="flex flex-col sm:flex-row items-center gap-2 py-2">
                            <tab.icon size={18} />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className="flex-1 mt-4">
                    {availableTabs.map(([key, tab]) => (
                        <TabsContent key={key} value={key} className="h-full mt-0 focus-visible:outline-none">
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
