'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis } from 'recharts';

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

    const domain = [0, Math.max(...data.map(p => p.value))];
    const range = [0, 500]; // Controls the size of the squares

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            const dayName = daysOfWeek[dataPoint.day];
            const hourName = `${String(dataPoint.hour).padStart(2, '0')}:00`;
            return (
                <div className="bg-popover p-2 border rounded-md shadow-lg text-popover-foreground">
                    <p>{`${dayName}, ${hourName}`}</p>
                    <p className="font-bold">{`Vendas: ${dataPoint.value}`}</p>
                </div>
            );
        }
        return null;
    };

    if (!hasMounted) {
        return <div className="w-full h-full min-w-[250px] min-h-[250px]" />;
    }

    return (
        <div className="w-full h-full min-w-[250px] min-h-[250px]"> {/* Garante um tamanho mínimo para o contêiner */}
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="hour"
                        type="category"
                        name="Hora"
                        ticks={hoursOfDay.filter((_, i) => i % 3 === 0)}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        dataKey="day"
                        type="category"
                        name="Dia"
                        ticks={daysOfWeek.map((_, i) => i)}
                        tickFormatter={(value) => daysOfWeek[value]}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        reversed={true}
                    />
                    <ZAxis dataKey="value" domain={domain} range={range} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Scatter name="Vendas" data={data} fill="hsl(var(--accent))" shape="square" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};