'use server';
/**
 * @fileOverview Fluxo de IA para análise de performance do BarDoLuis.
 * 
 * - analyzeBusinessPerformance: Analisa dados de vendas, estoque e despesas para gerar insights estratégicos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BusinessAnalysisInputSchema = z.object({
  revenue: z.number(),
  expenses: z.number(),
  netProfit: z.number(),
  topProducts: z.array(z.object({ name: z.string(), quantity: z.number() })),
  lowStockCount: z.number(),
  periodGoal: z.number(),
  goalProgress: z.number(),
});

export type BusinessAnalysisInput = z.infer<typeof BusinessAnalysisInputSchema>;

const BusinessAnalysisOutputSchema = z.object({
  summary: z.string().describe('Resumo executivo da performance do período.'),
  insights: z.array(z.string()).describe('Lista de 3 a 4 insights acionáveis.'),
  mood: z.enum(['good', 'warning', 'critical']).describe('Sentimento geral da operação.'),
  recommendation: z.string().describe('A principal recomendação do CEO/IA para o próximo período.'),
});

export type BusinessAnalysisOutput = z.infer<typeof BusinessAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'businessAnalysisPrompt',
  input: { schema: BusinessAnalysisInputSchema },
  output: { schema: BusinessAnalysisOutputSchema },
  prompt: `Você é o estrategista-chefe do BarDoLuis, localizado na Rua Tavares Bastos, Pompéia.
Sua missão é analisar os dados de BI e fornecer uma visão clara para o proprietário (o CEO).

DADOS DO PERÍODO:
- Receita Total: R$ {{{revenue}}}
- Despesas: R$ {{{expenses}}}
- Lucro Líquido: R$ {{{netProfit}}}
- Progresso da Meta: {{{goalProgress}}}% (Meta: R$ {{{periodGoal}}})
- Itens em Estoque Baixo: {{{lowStockCount}}}
- Top Produtos:
{{#each topProducts}}
  * {{{name}}}: {{{quantity}}} unidades
{{/each}}

INSTRUÇÕES:
1. Seja pragmático e direto.
2. Identifique gargalos (estoque baixo ou margem apertada).
3. Se a meta estiver longe de ser batida, sugira ações de marketing.
4. Use um tom encorajador mas rigoroso com os custos (Persona CFO).`,
});

// CTO: Definição do fluxo no nível global para evitar crash do servidor no boot
const analysisFlow = ai.defineFlow(
  {
    name: 'analyzeBusinessPerformanceFlow',
    inputSchema: BusinessAnalysisInputSchema,
    outputSchema: BusinessAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    return output!;
  }
);

export async function analyzeBusinessPerformance(input: BusinessAnalysisInput): Promise<BusinessAnalysisOutput> {
  return analysisFlow(input);
}
