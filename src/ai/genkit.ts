
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Inicialização centralizada do Genkit para o BarDoLuis.
 * Configura o acesso aos modelos de IA do Google para análise de negócios.
 */

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
