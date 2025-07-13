'use server';

/**
 * @fileOverview Business analyst AI agent for a bar.
 * - analyzeData - A function that analyzes sales data and answers questions.
 */

import { ai } from '@/ai/genkit';
import { BusinessAnalystInputSchema, BusinessAnalystOutputSchema, type BusinessAnalystInput, type BusinessAnalystOutput } from '@/ai/schemas/business-analyst-schema';


export async function analyzeData(input: BusinessAnalystInput): Promise<BusinessAnalystOutput> {
  return businessAnalystFlow(input);
}

const prompt = ai.definePrompt({
  name: 'businessAnalystPrompt',
  input: { schema: BusinessAnalystInputSchema },
  output: { schema: BusinessAnalystOutputSchema },
  prompt: `Aja como um analista de negócios e dados de um bar.
  
  Você receberá um conjunto de dados e uma pergunta. Sua tarefa é analisar os dados fornecidos para responder à pergunta do gerente de forma clara e direta.

  {{#if salesSummary}}
  Aqui estão os dados de vendas do período:
  {{json salesSummary}}
  {{/if}}

  {{#if customerProfile}}
  Aqui estão os dados do cliente a ser analisado:
  - Nome: {{{customerProfile.name}}}
  - Resumo das compras: {{{customerProfile.purchaseSummary}}}
  {{/if}}

  Pergunta do gerente: "{{{question}}}"

  Responda à pergunta com base nos dados. Se os dados não forem suficientes, indique isso. Se apropriado, sugira uma ação prática que o gerente possa tomar.`,
});

const businessAnalystFlow = ai.defineFlow(
  {
    name: 'businessAnalystFlow',
    inputSchema: BusinessAnalystInputSchema,
    outputSchema: BusinessAnalystOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
