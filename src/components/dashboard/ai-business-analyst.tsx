'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, Loader2 } from 'lucide-react';
import { analyzeBusinessPerformance, type BusinessAnalysisOutput } from '@/ai/flows/business-analysis-flow';
import { cn } from '@/lib/utils';

interface AIBusinessAnalystProps {
  reportData: any;
}

/**
 * @fileOverview Analista de Negócios com IA.
 * CTO: Saneamento de entidades JSX (&apos; e &quot;) para build Next.js.
 */
export const AIBusinessAnalyst: React.FC<AIBusinessAnalystProps> = ({ reportData }) => {
  const [analysis, setAnalysis] = useState<BusinessAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeBusinessPerformance({
        revenue: reportData.totalSalesRevenue,
        expenses: reportData.totalExpenses,
        netProfit: reportData.netProfit,
        topProducts: reportData.topProducts,
        lowStockCount: reportData.outOfStockProducts,
        periodGoal: reportData.finalGoal,
        goalProgress: reportData.goalProgress,
      });
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <CardTitle className="text-lg">Analista de IA</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-tight">Consultoria Estratégica BarDoLuis</CardDescription>
            </div>
          </div>
          {!analysis && !loading && (
            <Button onClick={handleAnalyze} size="sm" className="bg-primary hover:bg-primary/80 gap-2 font-bold uppercase text-[10px]">
              Gerar Insights
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase animate-pulse">Auditando números e tendências...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className={cn(
              "p-3 rounded-lg border-l-4 text-sm font-medium",
              analysis.mood === 'good' ? "bg-green-500/10 border-green-500 text-green-400" :
              analysis.mood === 'warning' ? "bg-yellow-500/10 border-yellow-500 text-yellow-400" :
              "bg-red-500/10 border-red-500 text-red-400"
            )}>
              {analysis.summary}
            </div>

            <div className="grid gap-3">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Lightbulb size={12} className="text-primary" /> Insights Acionáveis
              </h4>
              <ul className="space-y-2">
                {analysis.insights.map((insight, idx) => (
                  <li key={idx} className="text-xs flex gap-2 items-start">
                    <span className="text-primary mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 mb-2">
                <TrendingUp size={12} className="text-accent" /> Recomendação do CEO
              </h4>
              <p className="text-xs font-bold text-accent">{analysis.recommendation}</p>
            </div>

            <Button variant="ghost" onClick={handleAnalyze} className="w-full text-[10px] uppercase font-bold h-8 hover:bg-primary/10">
              Recalcular Análise
            </Button>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p className="text-xs italic">Clique em &quot;Gerar Insights&quot; para que a IA analise a performance do seu bar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
