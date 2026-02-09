'use client';
import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface GoalProgressChartProps {
    progress: number;
}

export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ progress }) => {
    // Limita o valor visual a 100% para o preenchimento da barra, mas exibe o valor real.
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const data = [{ name: 'Progress', value: progress > 100 ? 100 : progress }];
    const displayProgress = Math.round(progress);

    if (!hasMounted) {
        return <div className="w-full h-full min-w-[150px] min-h-[150px]" />;
    }
    return (
        <div className="w-full h-full min-w-[150px] min-h-[150px]"> {/* Garante um tamanho mínimo para o contêiner */}
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="80%"
                    outerRadius="100%"
                    data={data}
                    startAngle={90}
                    endAngle={-270}
                    barSize={12}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar
                        background={{ fill: 'hsl(var(--muted))' }}
                        dataKey="value"
                        angleAxisId={0}
                        fill="hsl(var(--accent))"
                        cornerRadius={10}
                    />
                    <text
                        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                        className="fill-foreground text-2xl font-bold"
                    >{`${displayProgress}%`}</text>
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    );
};