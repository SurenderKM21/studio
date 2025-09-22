'use server';

/**
 * @fileOverview A flow to generate the least crowded route from a source zone to a destination zone.
 *
 * - generateOptimalRoute - A function that handles the route generation process.
 * - GenerateOptimalRouteInput - The input type for the generateOptimalRoute function.
 * - GenerateOptimalRouteOutput - The return type for the generateOptimalRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOptimalRouteInputSchema = z.object({
  sourceZone: z.string().describe('The starting zone for the route.'),
  destinationZone: z.string().describe('The destination zone for the route.'),
  currentLocation: z
    .string()
    .describe(
      'The current GPS coordinates of the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateOptimalRouteInput = z.infer<typeof GenerateOptimalRouteInputSchema>;

const GenerateOptimalRouteOutputSchema = z.object({
  route: z.array(z.string()).describe('An array of zone IDs representing the optimal route.'),
  congestionLevel: z
    .string()
    .describe(
      'The overall congestion level of the route (e.g., \'low\', \'moderate\', \'high\').'
    ),
  alternativeRouteAvailable: z
    .boolean()
    .describe('Whether an alternative route is available due to congestion.'),
  alternativeRoute: z
    .array(z.string())
    .optional()
    .describe('An optional array of zone IDs representing an alternative route, if available.'),
});
export type GenerateOptimalRouteOutput = z.infer<typeof GenerateOptimalRouteOutputSchema>;

export async function generateOptimalRoute(
  input: GenerateOptimalRouteInput
): Promise<GenerateOptimalRouteOutput> {
  return generateOptimalRouteFlow(input);
}

const antColonyOptimizationTool = ai.defineTool(
  {
    name: 'antColonyOptimization',
    description:
      'Calculates the least crowded route between two zones, considering real-time congestion data and suggests alternative route if primary pathway is crowded.',
    inputSchema: z.object({
      sourceZone: z.string().describe('The starting zone for the route.'),
      destinationZone: z.string().describe('The destination zone for the route.'),
      currentLocation: z
        .string()
        .describe(
          'The current GPS coordinates of the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
        ),
    }),
    outputSchema: z.object({
      route: z
        .array(z.string())
        .describe('An array of zone IDs representing the optimal route.'),
      congestionLevel: z
        .string()
        .describe(
          'The overall congestion level of the route (e.g., \'low\', \'moderate\', \'high\').'
        ),
      alternativeRouteAvailable: z
        .boolean()
        .describe('Whether an alternative route is available due to congestion.'),
      alternativeRoute: z
        .array(z.string())
        .optional()
        .describe(
          'An optional array of zone IDs representing an alternative route, if available.'
        ),
    }),
  },
  async (input) => {
    // TODO: implement the Ant Colony Optimization algorithm here to determine optimal route
    // and alternative routes based on real-time congestion data
    // This is a placeholder. Replace with actual implementation.
    return {
      route: ['zoneA', 'zoneB', 'zoneC'],
      congestionLevel: 'moderate',
      alternativeRouteAvailable: true,
      alternativeRoute: ['zoneD', 'zoneE', 'zoneF'],
    };
  }
);

const prompt = ai.definePrompt({
  name: 'generateOptimalRoutePrompt',
  tools: [antColonyOptimizationTool],
  input: {schema: GenerateOptimalRouteInputSchema},
  output: {schema: GenerateOptimalRouteOutputSchema},
  prompt: `You are an AI assistant designed to find the optimal route for a user, leveraging real-time congestion data and the antColonyOptimization tool.

The user is currently in zone: {{{sourceZone}}}
Their destination is zone: {{{destinationZone}}}.
Their current GPS location: {{media url=currentLocation}}

Determine the best route using the antColonyOptimization tool and provide the user with the route, its congestion level, and if an alternative route is available due to congestion.
`,
});

const generateOptimalRouteFlow = ai.defineFlow(
  {
    name: 'generateOptimalRouteFlow',
    inputSchema: GenerateOptimalRouteInputSchema,
    outputSchema: GenerateOptimalRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
