'use server';

/**
 * @fileOverview Customer insights AI agent.
 *
 * - getCustomerInsights - A function that handles the process of providing insights based on customer purchase history and preferences.
 */

import {ai} from '@/ai/genkit';
import { CustomerInsightsInputSchema, CustomerInsightsOutputSchema, type CustomerInsightsInput, type CustomerInsightsOutput } from '@/ai/schemas/customer-insights-schema';


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
