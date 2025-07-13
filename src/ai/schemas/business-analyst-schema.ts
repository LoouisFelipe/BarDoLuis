/**
 * @fileOverview Schemas for the Business Analyst AI agent.
 */

import { z } from 'zod';

const SalesSummarySchema = z.object({
  total: z.number(),
  items: z.number(),
  hour: z.number(),
  day: z.number().describe('0 = Sunday, 1 = Monday, etc.'),
});

const CustomerProfileSchema = z.object({
  name: z.string().describe('Customer name'),
  purchaseSummary: z.string().describe('A summary of items and quantities purchased.'),
});


export const BusinessAnalystInputSchema = z.object({
  salesSummary: z.array(SalesSummarySchema).optional().describe('A summary of sales data for a given period.'),
  customerProfile: CustomerProfileSchema.optional().describe('The profile of a specific customer to be analyzed.'),
  question: z.string().describe('The specific question the user is asking about the data.'),
});
export type BusinessAnalystInput = z.infer<typeof BusinessAnalystInputSchema>;

export const BusinessAnalystOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question, based on the provided data.'),
});
export type BusinessAnalystOutput = z.infer<typeof BusinessAnalystOutputSchema>;
