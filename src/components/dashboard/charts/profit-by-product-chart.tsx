'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { truncateText } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ChartData {
  name: string;
  profit: number;
}

interface ProfitByProductChartProps {
  data: ChartData[];
}

export const ProfitByProductChart: React.FC<ProfitByProductChartProps> = ({ data }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  // CFO Rule: Prevent rendering if data is empty or null to avoid NaN errors
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-card/50 rounded-lg">
        <Package size={48} className="mb-4" />
        <h3 className="text-lg font-bold">Sem dados de lucro</h3>
        <p className="text-sm">Nenhum produto com lucro foi vendido neste período.</p>
      </div>
    );
  }
  
  if (!hasMounted) {
    return <div className="w-full h-full min-w-[200px] min-h-[200px]" />;
  }

  return (
    <div className="w-full h-full min-w-[200px] min-h-[200px]"> {/* Garante um tamanho mínimo para o contêiner */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={100}
            tickFormatter={(value) => truncateText(value, 15)}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--card))' }}
            contentStyle={{
              background: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Lucro']}
          />
          <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
              <LabelList dataKey="profit" position="right" formatter={(value: number) => `R$ ${value.toFixed(2)}`} className="fill-foreground font-semibold" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
