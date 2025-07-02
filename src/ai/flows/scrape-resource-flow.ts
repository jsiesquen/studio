'use server';
/**
 * @fileOverview An AI flow to analyze a resource's URL and name to infer metadata.
 *
 * - scrapeResource - A function that handles the resource analysis process.
 * - ScrapeResourceInput - The input type for the scrapeResource function.
 * - ScrapeResourceOutput - The return type for the scrapeResource function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ScrapeResourceInputSchema = z.object({
  name: z.string().describe('The name of the resource.'),
  url: z.string().url().describe('The URL of the resource to analyze.'),
});
export type ScrapeResourceInput = z.infer<typeof ScrapeResourceInputSchema>;

const ScrapeResourceOutputSchema = z.object({
  duration: z.string().optional().describe('The estimated time to consume the resource (e.g., "15 mins", "2 hours").'),
  manualLastUpdate: z
    .string()
    .optional()
    .describe('The estimated last update date of the content in MM/YYYY format.'),
});
export type ScrapeResourceOutput = z.infer<typeof ScrapeResourceOutputSchema>;

export async function scrapeResource(input: ScrapeResourceInput): Promise<ScrapeResourceOutput> {
  return scrapeResourceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scrapeResourcePrompt',
  input: { schema: ScrapeResourceInputSchema },
  output: { schema: ScrapeResourceOutputSchema },
  prompt: `You are an intelligent web content analyzer. Your task is to analyze the provided resource name and URL to infer specific details about the content.

Resource Name: {{{name}}}
Resource URL: {{{url}}}

Based on this information, please provide your best estimate for the following fields:
1.  **duration**: The likely duration or time required to consume this resource (e.g., "32 minutes", "3,5 hours"). return the value with "Xh" o "Xm" format in case hours or minutes respectly. Remember replace the "X" with the number found.
2.  **manualLastUpdate**: The date the resource was last updated, in strict MM/YYYY format. Analyze the first visible cues to make an educated guess. The value this after a first "Last updated" label that found. Return the value in MM/YYYY format.

If you cannot confidently determine a value for any field, leave it blank. Do not invent information. Your response must be in the requested JSON format.`,
});

const scrapeResourceFlow = ai.defineFlow(
  {
    name: 'scrapeResourceFlow',
    inputSchema: ScrapeResourceInputSchema,
    outputSchema: ScrapeResourceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output ?? { duration: undefined, manualLastUpdate: undefined };
  }
);
