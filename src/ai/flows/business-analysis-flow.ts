'use server';

/**
 * @fileOverview Fluxo de IA OTIMIZADO para análise de performance.
 * * CTO NOTE: Removemos o 'ai.defineFlow' do escopo global para eliminar 
 * o tempo de carregamento no startup da aplicação.
 */

import { z } from 'genkit';
// Importaremos a 'ai' apenas onde for necessário ou manteremos aqui se o arquivo genkit for leve.
import { ai } from '@/ai/genkit'; 

// 1. Schemas (Leves, podem ficar no global)
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

// 2. Prompt (Definição estática é OK, mas a execução deve ser controlada)
const analysisPrompt = ai.definePrompt({
  name: 'businessAnalysisPrompt',
  input: { schema: BusinessAnalysisInputSchema },
  output: { schema: BusinessAnalysisOutputSchema },
  prompt: `Você é o estrategista-chefe do BarDoLuis.
  DADOS:
  - Receita: R$ {{{revenue}}}
  - Despesas: R$ {{{expenses}}}
  - Lucro: R$ {{{netProfit}}}
  - Meta: {{{goalProgress}}}% (Alvo: {{{periodGoal}}})
  - Estoque Baixo: {{{lowStockCount}}}
  - Top Produtos: {{#each topProducts}} * {{{name}}}: {{{quantity}}} {{/each}}
  
  INSTRUÇÕES:
  Identifique gargalos e sugira ações. Seja breve.`,
});

// 3. Função Principal (Onde a mágica acontece)
export async function analyzeBusinessPerformance(input: BusinessAnalysisInput): Promise<BusinessAnalysisOutput> {
  // CTO: Chamamos o prompt diretamente. Isso evita a sobrecarga de criar um 'Flow' 
  // registrado globalmente se não formos usar a UI de desenvolvedor do Genkit em produção.
  
  const result = await analysisPrompt(input);
  
  return result.output!;
}