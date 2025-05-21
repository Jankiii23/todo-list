'use server';

/**
 * @fileOverview Provides AI-powered category suggestions for tasks based on
 * similar tasks completed by TaskFlow users.
 *
 * - suggestCategory -  A function that suggests a category for a given task.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task for which to suggest a category.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  suggestedCategory: z
    .string()
    .describe('The suggested category for the task, chosen from: Work, Personal, Errands, Health, Finance, Education, or Other.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested category, based on similar tasks.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are a task categorization expert. Given the description of a task, you will suggest a category for it.

  The available categories are: Work, Personal, Errands, Health, Finance, Education, or Other.

  Provide a brief reasoning for your suggestion.

  Task description: {{{taskDescription}}}
  `,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
