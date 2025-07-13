'use server';

/**
 * @fileOverview Customer insights AI agent.
 *
 * - getCustomerInsights - A function that handles the process of providing insights based on customer purchase history and preferences.
 * - CustomerInsightsInput - The input type for the getCustomerInsights function.
 * - CustomerInsightsOutput - The return type for the getCustomerInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerInsightsInputSchema = z.object({
  customerPurchaseHistory: z
    .string()
    .describe('The purchase history of the customer.'),
  customerPreferences: z.string().describe('The preferences of the customer.'),
});
export type CustomerInsightsInput = z.infer<typeof CustomerInsightsInputSchema>;

const CustomerInsightsOutputSchema = z.object({
  insights: z.string().describe('Insights into customer purchase history and preferences.'),
  suggestedMarketingActions: z
    .string()
    .describe('Suggested marketing actions to improve customer loyalty.'),
});
export type CustomerInsightsOutput = z.infer<typeof CustomerInsightsOutputSchema>;

export async function getCustomerInsights(input: CustomerInsightsInput): Promise<CustomerInsightsOutput> {
  return customerInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerInsightsPrompt',
  input: {schema: CustomerInsightsInputSchema},
  output: {schema: CustomerInsightsOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing customer data to provide insights and suggest marketing actions.

  Analyze the following customer purchase history and preferences to identify key trends and opportunities.

  Customer Purchase History: {{{customerPurchaseHistory}}}
  Customer Preferences: {{{customerPreferences}}}

  Based on your analysis, provide insights into the customer's behavior and suggest targeted marketing actions to improve customer loyalty.
  Ensure your suggested marketing actions are specific, actionable, and aligned with the customer's preferences and purchase history.
  Consider marketing actions such as personalized promotions, targeted advertising, loyalty programs, and product recommendations.
  Output the insights and suggested marketing actions as separate strings in the JSON output.
  `,
});

const customerInsightsFlow = ai.defineFlow(
  {
    name: 'customerInsightsFlow',
    inputSchema: CustomerInsightsInputSchema,
    outputSchema: CustomerInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
