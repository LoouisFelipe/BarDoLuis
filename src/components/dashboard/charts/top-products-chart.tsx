
'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { truncateText } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ChartData {
  name: string;
  quantity: number;
}

interface TopProductsChartProps {
  data: ChartData[];
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-card/50 rounded-lg">
        <Package size={48} className="mb-4" />
        <h3 className="text-lg font-bold">Sem dados de vendas</h3>
        <p className="text-sm">Nenhum produto foi vendido neste período.</p>
      </div>
    );
  }
  
  if (!hasMounted) {
    return <div className="w-full h-full min-w-[200px] min-h-[200px]" />;
  }

  return (
    <div className="w-full h-full min-w-[200px] min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            width={150} 
            tickFormatter={(value) => truncateText(value, 25)} 
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--card))' }}
            contentStyle={{
              background: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number) => [`${value} unidades`, 'Quantidade']}
          />
          <Bar dataKey="quantity" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]}>
              <LabelList dataKey="quantity" position="right" formatter={(value: number) => `${value} un.`} className="fill-foreground font-semibold text-[10px]" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
