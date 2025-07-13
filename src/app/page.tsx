import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, Package, DollarSign, Cpu, HandCoins } from "lucide-react";

import { Suppliers } from "@/components/suppliers";
import { Purchases } from "@/components/purchases";
import { Inventory } from "@/components/inventory";
import { Customers } from "@/components/customers";
import { AiInsights } from "@/components/ai-insights";
import { Finance } from "@/components/finance";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            BARDOLUIS
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Your All-in-One Business Management Suite
          </p>
        </header>

        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto">
            <TabsTrigger value="suppliers" className="py-2"><Users className="mr-2" />Fornecedores</TabsTrigger>
            <TabsTrigger value="purchases" className="py-2"><ShoppingCart className="mr-2" />Compras</TabsTrigger>
            <TabsTrigger value="inventory" className="py-2"><Package className="mr-2" />Estoque</TabsTrigger>
            <TabsTrigger value="customers" className="py-2"><HandCoins className="mr-2" />Clientes</TabsTrigger>
            <TabsTrigger value="ai-insights" className="py-2"><Cpu className="mr-2" />AI Insights</TabsTrigger>
            <TabsTrigger value="finance" className="py-2"><DollarSign className="mr-2" />Financeiro</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="suppliers">
              <Suppliers />
            </TabsContent>
            <TabsContent value="purchases">
              <Purchases />
            </TabsContent>
            <TabsContent value="inventory">
              <Inventory />
            </TabsContent>
            <TabsContent value="customers">
              <Customers />
            </TabsContent>
            <TabsContent value="ai-insights">
              <AiInsights />
            </TabsContent>
            <TabsContent value="finance">
              <Finance />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
