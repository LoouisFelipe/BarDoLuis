
'use client';

import { useMemo } from 'react';
import { isWithinInterval, startOfDay, endOfDay, subDays, differenceInDays, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import { Transaction, Product, Customer } from '@/lib/schemas';
import { DateRange } from 'react-day-picker';

interface UseReportDataProps {
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  date: DateRange | undefined;
  periodGoal: number;
}

export const useReportData = ({
  transactions,
  products,
  customers,
  date,
  periodGoal,
}: UseReportDataProps) => {
  return useMemo(() => {
    if (!date?.from) return null;

    const from = startOfDay(date.from);
    const to = endOfDay(date.to || date.from);
    const interval = { start: from, end: to };

    const filteredTransactions = (transactions || []).filter((t) => {
      const timestamp = (t.timestamp as any)?.toDate ? (t.timestamp as any).toDate() : t.timestamp;
      return timestamp && isWithinInterval(timestamp, interval);
    });

    const monthStart = startOfMonth(from);
    const monthEnd = endOfMonth(from);
    const daysInMonth = getDaysInMonth(from);
    const daysInPeriod = Math.max(differenceInDays(to, from) + 1, 1);

    const totalMonthlyExpenses = (transactions || []).filter((t) => {
      const timestamp = (t.timestamp as any)?.toDate ? (t.timestamp as any).toDate() : t.timestamp;
      return t.type === 'expense' && timestamp && isWithinInterval(timestamp, { start: monthStart, end: monthEnd });
    }).reduce((acc, t) => acc + (t.total || 0), 0);

    const defaultMonthlyGoal = 30000; 
    const effectiveMonthlyExpenses = totalMonthlyExpenses > 0 ? totalMonthlyExpenses : defaultMonthlyGoal;

    const dailyCost = effectiveMonthlyExpenses / daysInMonth;
    const dynamicCostGoal = dailyCost * daysInPeriod;

    const daysDiff = differenceInDays(to, from) + 1;
    const prevFrom = startOfDay(subDays(from, daysDiff));
    const prevTo = endOfDay(subDays(to, daysDiff));
    const prevInterval = { start: prevFrom, end: prevTo };

    const prevTransactions = (transactions || []).filter((t) => {
      const timestamp = (t.timestamp as any)?.toDate ? (t.timestamp as any).toDate() : t.timestamp;
      return timestamp && isWithinInterval(timestamp, prevInterval);
    });

    const calculateMetrics = (txs: Transaction[]) => {
      let revenue = 0;
      let gameRevenue = 0;
      let cashInflow = 0;
      let expenses = 0;
      let insumos = 0;
      let salesCount = 0;
      let cogs = 0;

      txs.forEach((t) => {
        if (t.type === 'sale') {
          revenue += (t.total || 0);
          salesCount++;
          if (t.paymentMethod !== 'Fiado') {
            cashInflow += (t.total || 0);
          }
          if (t.items) {
            t.items.forEach((item: any) => {
              // Auditoria de Receita de Jogos
              if (item.identifier) {
                gameRevenue += (item.unitPrice * item.quantity);
              }

              const product = (products || []).find((p) => p.id === item.productId);
              if (product) {
                const baseUnitSize = product.baseUnitSize || 1;
                const costPerMl = (product.costPrice || 0) / baseUnitSize;
                const itemSize = item.size || 1; 
                const effectiveCost = item.size ? (costPerMl * itemSize) : (product.costPrice || 0);
                cogs += effectiveCost * (item.quantity || 1);
              }
            });
          }
        } else if (t.type === 'payment') {
          cashInflow += (t.total || 0);
        } else if (t.type === 'expense') {
          expenses += (t.total || 0);
          if (t.expenseCategory === 'Insumos') {
            insumos += (t.total || 0);
          }
        }
      });

      const barRevenue = revenue - gameRevenue;
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - expenses;
      const avgTicket = salesCount > 0 ? revenue / salesCount : 0;

      return { revenue, gameRevenue, barRevenue, cashInflow, expenses, insumos, salesCount, grossProfit, netProfit, avgTicket };
    };

    const currentMetrics = calculateMetrics(filteredTransactions);
    const prevMetrics = calculateMetrics(prevTransactions);

    const calculateDelta = (curr: number, prev: number) => {
      if (prev <= 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const topProductsMap = new Map<string, number>();
    const profitByProductMap = new Map<string, number>();
    const salesByPaymentMethodMap = new Map<string, number>();
    const cashInflowByMethodMap = new Map<string, number>();
    const expensesByCategoryMap = new Map<string, number>();
    const purchasesBySupplierMap = new Map<string, number>();
    const heatmapMap = new Map<string, number>();
    const salesByHourMap = new Map<string, number>();

    filteredTransactions.forEach((t) => {
      const timestamp = (t.timestamp as any)?.toDate ? (t.timestamp as any).toDate() : t.timestamp;
      if (!timestamp) return;
      
      const day = timestamp.getDay();
      const hour = timestamp.getHours();
      const hourKey = `${String(hour).padStart(2, '0')}:00`;
      const heatmapKey = `${day}-${hour}`;
      
      if (t.type === 'sale') {
        heatmapMap.set(heatmapKey, (heatmapMap.get(heatmapKey) || 0) + 1);
        salesByHourMap.set(hourKey, (salesByHourMap.get(hourKey) || 0) + 1);
        
        const method = t.paymentMethod || 'Outros';
        salesByPaymentMethodMap.set(method, (salesByPaymentMethodMap.get(method) || 0) + (t.total || 0));
        if (method !== 'Fiado') {
          cashInflowByMethodMap.set(method, (cashInflowByMethodMap.get(method) || 0) + (t.total || 0));
        }

        if (t.items) {
          t.items.forEach((item: any) => {
            topProductsMap.set(item.name, (topProductsMap.get(item.name) || 0) + (item.quantity || 1));
            
            const product = (products || []).find((p) => p.id === item.productId);
            if (product) {
                const baseUnitSize = product.baseUnitSize || 1;
                const costPerMl = (product.costPrice || 0) / baseUnitSize;
                const itemSize = item.size || 1;
                const effectiveCost = item.size ? (costPerMl * itemSize) : (product.costPrice || 0);
                const profit = ((item.unitPrice || 0) - effectiveCost) * (item.quantity || 1);
                profitByProductMap.set(item.name, (profitByProductMap.get(item.name) || 0) + profit);
            }
          });
        }
      } else if (t.type === 'payment') {
        const method = t.paymentMethod || 'Dinheiro';
        cashInflowByMethodMap.set(method, (cashInflowByMethodMap.get(method) || 0) + (t.total || 0));
      } else if (t.type === 'expense') {
        const cat = t.expenseCategory || 'Geral';
        expensesByCategoryMap.set(cat, (expensesByCategoryMap.get(cat) || 0) + (t.total || 0));
        
        if (cat === 'Insumos') {
            const supplier = t.description?.replace('Compra: ', '') || 'Outros';
            purchasesBySupplierMap.set(supplier, (purchasesBySupplierMap.get(supplier) || 0) + (t.total || 0));
        }
      }
    });

    const topProducts = Array.from(topProductsMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const profitByProduct = Array.from(profitByProductMap.entries())
      .map(([name, profit]) => ({ name, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    const salesHeatmapData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        salesHeatmapData.push({ day, hour, value: heatmapMap.get(`${day}-${hour}`) || 0 });
      }
    }

    const salesByHourForChart = Array.from({ length: 24 }, (_, i) => {
        const hourLabel = `${String(i).padStart(2, '0')}:00`;
        return { hour: hourLabel, vendas: salesByHourMap.get(hourLabel) || 0 };
    });

    const finalGoal = periodGoal > 0 ? periodGoal : dynamicCostGoal;

    return {
      totalSalesRevenue: currentMetrics.revenue || 0,
      totalGameRevenue: currentMetrics.gameRevenue || 0,
      totalBarRevenue: currentMetrics.barRevenue || 0,
      totalCashInflow: currentMetrics.cashInflow || 0,
      totalExpenses: currentMetrics.expenses || 0,
      totalInsumos: currentMetrics.insumos || 0,
      grossProfit: currentMetrics.grossProfit || 0,
      netProfit: currentMetrics.netProfit || 0,
      salesCount: currentMetrics.salesCount || 0,
      avgTicket: currentMetrics.avgTicket || 0,
      goalProgress: finalGoal > 0 ? (currentMetrics.revenue / finalGoal) * 100 : 0,
      finalGoal,
      deltas: {
        revenue: calculateDelta(currentMetrics.revenue, prevMetrics.revenue),
        cashInflow: calculateDelta(currentMetrics.cashInflow, prevMetrics.cashInflow),
        expenses: calculateDelta(currentMetrics.expenses, prevMetrics.expenses),
        insumos: calculateDelta(currentMetrics.insumos, prevMetrics.insumos),
        grossProfit: calculateDelta(currentMetrics.grossProfit, prevMetrics.grossProfit),
        netProfit: calculateDelta(currentMetrics.netProfit, prevMetrics.netProfit),
        salesCount: calculateDelta(currentMetrics.salesCount, prevMetrics.salesCount),
        avgTicket: calculateDelta(currentMetrics.avgTicket, prevMetrics.avgTicket),
      },
      topProducts,
      profitByProduct,
      salesHeatmapData,
      salesByHourForChart,
      salesTransactions: filteredTransactions.filter(t => t.type === 'sale'),
      expenseTransactions: filteredTransactions.filter(t => t.type === 'expense'),
      purchaseTransactions: filteredTransactions.filter(t => t.type === 'expense' && t.expenseCategory === 'Insumos'),
      paymentTransactions: filteredTransactions.filter(t => t.type === 'payment'),
      salesByPaymentMethodForChart: Array.from(salesByPaymentMethodMap.entries()).map(([name, value]) => ({ name, value })),
      cashInflowByMethodForChart: Array.from(cashInflowByMethodMap.entries()).map(([name, value]) => ({ name, value })),
      expensesByCategoryForChart: Array.from(expensesByCategoryMap.entries()).map(([name, value]) => ({ name, value })),
      purchasesBySupplierForChart: Array.from(purchasesBySupplierMap.entries()).map(([name, value]) => ({ name, value })),
      customersWithDebt: (customers || []).filter((c) => (c.balance || 0) > 0).length,
      totalCustomerDebt: (customers || []).reduce((sum, c) => sum + (c.balance || 0), 0),
      outOfStockProducts: (products || []).filter((p) => p.saleType !== 'service' && (p.stock || 0) <= 0).length,
      totalProducts: (products || []).length,
    };
  }, [transactions, products, customers, date, periodGoal]);
};
