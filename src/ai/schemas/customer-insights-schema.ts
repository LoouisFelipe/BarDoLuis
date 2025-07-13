/**
 * @fileOverview Schemas for the Customer Insights AI agent.
 */

import {z} from 'zod';

export const CustomerInsightsInputSchema = z.object({
  customerPurchaseHistory: z
    .string()
    .describe('The purchase history of the customer.'),
  customerPreferences: z.string().describe('The preferences of the customer.'),
});
export type CustomerInsightsInput = z.infer<typeof CustomerInsightsInputSchema>;

export const CustomerInsightsOutputSchema = z.object({
  insights: z.string().describe('Insights into customer purchase history and preferences.'),
  suggestedMarketingActions: z
    .string()

    .describe('Suggested marketing actions to improve customer loyalty.'),
});
export type CustomerInsightsOutput = z.infer<typeof CustomerInsightsOutputSchema>;
