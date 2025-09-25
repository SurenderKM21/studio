'use server';

/**
 * @fileOverview A flow to generate the least crowded route from a source zone to a destination zone.
 *
 * - generateOptimalRoute - A function that handles the route generation process.
 * - GenerateOptimalRouteInput - The input type for the generateOptimalRoute function.
 * - GenerateOptimalRouteOutput - The return type for the generateOptimalRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateOptimalRouteInputSchema = z.object({
  sourceZone: z.string().describe('The starting zone for the route.'),
  destinationZone: z.string().describe('The destination zone for the route.'),
});
export type GenerateOptimalRouteInput = z.infer<typeof GenerateOptimalRouteInputSchema>;

const GenerateOptimalRouteOutputSchema = z.object({
  route: z.array(z.string()).describe('An array of zone IDs representing the optimal route.'),
  congestionLevel: z
    .string()
    .describe(
      "The overall congestion level of the route (e.g., 'low', 'moderate', 'high')."
    ),
  alternativeRouteAvailable: z
    .boolean()
    .describe('Whether an alternative route is available due to congestion.'),
});
export type GenerateOptimalRouteOutput = z.infer<typeof GenerateOptimalRouteOutputSchema>;

export async function generateOptimalRoute(
  input: GenerateOptimalRouteInput
): Promise<GenerateOptimalRouteOutput> {
  return generateOptimalRouteFlow(input);
}


const generateOptimalRouteFlow = ai.defineFlow(
  {
    name: 'generateOptimalRouteFlow',
    inputSchema: GenerateOptimalRouteInputSchema,
    outputSchema: GenerateOptimalRouteOutputSchema,
  },
  async ({ sourceZone, destinationZone }) => {
    // This is a placeholder implementation.
    // In a real application, you would implement a pathfinding algorithm here.
    const route = [sourceZone, destinationZone];
    const congestionLevel = 'low';
    const alternativeRouteAvailable = false;

    return {
      route,
      congestionLevel,
      alternativeRouteAvailable,
    };
  }
);
