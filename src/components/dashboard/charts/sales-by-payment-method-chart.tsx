'use client';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CreditCard } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
}

interface SalesByPaymentMethodChartProps {
  data: ChartData[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = payload.reduce((acc: number, entry: any) => acc + entry.payload.value, 0);
    const percentage = ((data.value / total) * 100).toFixed(2);
    
    return (
      <div className="p-2 rounded-md border bg-popover text-popover-foreground shadow-md">
        <p className="font-semibold">{`${data.name}: R$ ${data.value.toFixed(2)}`}</p>
        <p className="text-sm text-muted-foreground">{`Representa ${percentage}% do total`}</p>
      </div>
    );
  }

  return null;
};

export const SalesByPaymentMethodChart: React.FC<SalesByPaymentMethodChartProps> = ({ data }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  const chartData = data.filter(item => item.value > 0);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-card/50 rounded-lg">
        <CreditCard size={48} className="mb-4" />
        <h3 className="text-lg font-bold">Sem dados de pagamento</h3>
        <p className="text-sm">Nenhuma venda foi registrada neste período.</p>
      </div>
    );
  }
  
  if (!hasMounted) {
    return <div className="w-full h-full min-w-[200px] min-h-[200px]" />;
  }

  return (
    <div className="w-full h-full min-w-[200px] min-h-[200px]"> {/* Garante um tamanho mínimo para o contêiner */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{fontSize: "14px"}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
