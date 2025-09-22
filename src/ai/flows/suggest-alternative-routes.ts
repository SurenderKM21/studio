'use server';

/**
 * @fileOverview A flow to suggest alternative routes if the primary pathway is overly congested.
 *
 * - suggestAlternativeRoutes - A function that suggests alternative routes based on congestion.
 * - SuggestAlternativeRoutesInput - The input type for the suggestAlternativeRoutes function.
 * - SuggestAlternativeRoutesOutput - The return type for the suggestAlternativeRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeRoutesInputSchema = z.object({
  sourceZone: z.string().describe('The starting zone for the route.'),
  destinationZone: z.string().describe('The destination zone for the route.'),
  currentRoute: z.array(z.string()).describe('The current route as an array of zone IDs.'),
  congestionData: z.record(z.string(), z.string()).describe('A map of zone IDs to congestion levels (over-crowded, crowded, moderate, free).'),
});

export type SuggestAlternativeRoutesInput = z.infer<
  typeof SuggestAlternativeRoutesInputSchema
>;

const SuggestAlternativeRoutesOutputSchema = z.object({
  alternativeRoutes: z
    .array(z.array(z.string()))
    .describe('An array of alternative routes, each route being an array of zone IDs.'),
  reasoning: z.string().describe('The AI reasoning behind the suggested alternative routes.'),
});

export type SuggestAlternativeRoutesOutput = z.infer<
  typeof SuggestAlternativeRoutesOutputSchema
>;

export async function suggestAlternativeRoutes(
  input: SuggestAlternativeRoutesInput
): Promise<SuggestAlternativeRoutesOutput> {
  return suggestAlternativeRoutesFlow(input);
}

const antColonyOptimizationTool = ai.defineTool({
  name: 'antColonyOptimization',
  description: 'Finds alternative routes using Ant Colony Optimization algorithm, considering congestion levels.',
  inputSchema: z.object({
    sourceZone: z.string().describe('The starting zone for the route.'),
    destinationZone: z.string().describe('The destination zone for the route.'),
    currentRoute: z.array(z.string()).describe('The current route as an array of zone IDs.'),
    congestionData: z
      .record(z.string(), z.string())
      .describe(
        'A map of zone IDs to congestion levels (over-crowded, crowded, moderate, free).'
      ),
  }),
  outputSchema: z.array(z.array(z.string())).describe('An array of alternative routes.'),
},
async (input) => {
  // Placeholder implementation for Ant Colony Optimization
  // In a real application, this would call an actual optimization algorithm.
  // This example provides a simple, hardcoded alternative route for demonstration.
  console.log('Running ant colony optimizaiton');
  const {sourceZone, destinationZone, currentRoute, congestionData} = input;

    // Basic check for congestion in the current route
    const isCurrentRouteCongested = currentRoute.some(zoneId => congestionData[zoneId] === 'over-crowded' || congestionData[zoneId] === 'crowded');
  
    if (!isCurrentRouteCongested) {
      // If the current route isn't congested, return an empty array
      return [];
    }

  const alternativeRoute = [sourceZone, 'zoneC', 'zoneD', destinationZone]; // Example route
  return [alternativeRoute];
});


const prompt = ai.definePrompt({
  name: 'suggestAlternativeRoutesPrompt',
  input: {schema: SuggestAlternativeRoutesInputSchema},
  output: {schema: SuggestAlternativeRoutesOutputSchema},
  tools: [antColonyOptimizationTool],
  prompt: `You are an AI route planner that suggests alternative routes in a crowded environment.

  The user is currently planning to go from {{{sourceZone}}} to {{{destinationZone}}}. They are currently planning to take this route:
  {{#each currentRoute}}
    - {{{this}}}
  {{/each}}
  
  Here is the current congestion data for each zone:
  {{#each congestionData}}
    - {{{@key}}}: {{{this}}}
  {{/each}}

  Determine if the current route is overly congested based on the congestion data. If it is, use the antColonyOptimization tool to find alternative routes.
  Explain your reasoning for suggesting these routes, and provide the alternative routes in the format specified in the output schema.  If the tool returns no routes, then indicate that no alternative routes were found.
  `, 
});

const suggestAlternativeRoutesFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeRoutesFlow',
    inputSchema: SuggestAlternativeRoutesInputSchema,
    outputSchema: SuggestAlternativeRoutesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
