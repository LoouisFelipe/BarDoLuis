
'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

interface HeatmapDataPoint {
    day: number; // 0 for Sunday, 6 for Saturday
    hour: number; // 0-23
    value: number;
}

interface SalesHeatmapChartProps {
    data: HeatmapDataPoint[];
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hoursOfDay = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}`);

export const SalesHeatmapChart: React.FC<SalesHeatmapChartProps> = ({ data }) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de vendas para exibir.</div>;
    }

    // CTO: Escala de cores baseada na densidade (de 0 a 100% do máximo)
    const maxValue = Math.max(...data.map(p => p.value), 1);
    
    const getColor = (value: number) => {
        if (value === 0) return 'hsl(var(--muted) / 0.2)';
        const opacity = Math.min(0.2 + (value / maxValue) * 0.8, 1);
        return `hsl(var(--accent) / ${opacity})`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            const dayName = daysOfWeek[dataPoint.day];
            const hourName = `${String(dataPoint.hour).padStart(2, '0')}:00`;
            return (
                <div className="bg-popover p-2 border rounded-md shadow-lg text-popover-foreground">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">{dayName}, {hourName}</p>
                    <p className="font-bold">{`Densidade: ${dataPoint.value}`}</p>
                </div>
            );
        }
        return null;
    };

    if (!hasMounted) {
        return <div className="w-full h-full min-w-[250px] min-h-[250px]" />;
    }

    return (
        <div className="w-full h-full min-w-[250px] min-h-[250px] bg-card/20 rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <XAxis
                        dataKey="hour"
                        type="category"
                        name="Hora"
                        ticks={hoursOfDay.filter((_, i) => i % 3 === 0)}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        dataKey="day"
                        type="category"
                        name="Dia"
                        ticks={daysOfWeek.map((_, i) => i)}
                        tickFormatter={(value) => daysOfWeek[value]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                        reversed={true}
                    />
                    {/* ZAxis fixo para garantir que os quadrados tenham tamanho uniforme */}
                    <ZAxis type="number" range={[400, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Scatter data={data} shape="square">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
