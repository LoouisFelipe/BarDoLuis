'use server';

/**
 * @fileOverview Fluxo de IA centralizado para análise de performance.
 * CTO: Implementação global para estabilidade do servidor Next.js.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit'; 

// 1. Schemas de Dados
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

// 2. Definição do Prompt (Escopo Global)
const analysisPrompt = ai.definePrompt({
  name: 'businessAnalysisPrompt',
  input: { schema: BusinessAnalysisInputSchema },
  output: { schema: BusinessAnalysisOutputSchema },
  prompt: `Você é o estrategista-chefe do BarDoLuis na Rua Tavares Bastos.
  Analise os seguintes dados operacionais e financeiros:
  
  RECEITA: R$ {{{revenue}}}
  DESPESAS: R$ {{{expenses}}}
  LUCRO LÍQUIDO: R$ {{{netProfit}}}
  PROGRESSO DA META: {{{goalProgress}}}% (Alvo: R$ {{{periodGoal}}})
  PRODUTOS COM ESTOQUE BAIXO: {{{lowStockCount}}}
  TOP PRODUTOS (MIX):
  {{#each topProducts}} * {{{name}}}: {{{quantity}}} unidades
  {{/each}}
  
  DIRETRIZES:
  - Seja pragmático como um CTO e detalhista como um CFO.
  - Identifique gargalos imediatos.
  - Sugira promoções se a receita estiver baixa ou reposição se o estoque estiver crítico.
  - Use um tom profissional e focado em lucro.`,
});

// 3. Função Principal (Wrapper)
export async function analyzeBusinessPerformance(input: BusinessAnalysisInput): Promise<BusinessAnalysisOutput> {
  const result = await analysisPrompt(input);
  return result.output!;
}
