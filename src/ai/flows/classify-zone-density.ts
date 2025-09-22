'use server';

/**
 * @fileOverview Classifies a zone's crowd density based on real-time user location data.
 *
 * - classifyZoneDensity - A function that classifies a zone's crowd density.
 * - ClassifyZoneDensityInput - The input type for the classifyZoneDensity function.
 * - ClassifyZoneDensityOutput - The return type for the classifyZoneDensity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyZoneDensityInputSchema = z.object({
  zoneId: z.string().describe('The ID of the zone to classify.'),
  userCount: z.number().describe('The number of users currently in the zone.'),
  capacity: z.number().describe('The maximum capacity of the zone.'),
  coordinates: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).describe('GPS coordinates defining the zone boundary polygon.')
});

export type ClassifyZoneDensityInput = z.infer<typeof ClassifyZoneDensityInputSchema>;

const ClassifyZoneDensityOutputSchema = z.object({
  densityCategory: z.enum(['over-crowded', 'crowded', 'moderate', 'free']).describe('The crowd density category of the zone.'),
  justification: z.string().describe('The reasoning behind the density classification.'),
});

export type ClassifyZoneDensityOutput = z.infer<typeof ClassifyZoneDensityOutputSchema>;

export async function classifyZoneDensity(input: ClassifyZoneDensityInput): Promise<ClassifyZoneDensityOutput> {
  return classifyZoneDensityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyZoneDensityPrompt',
  input: {schema: ClassifyZoneDensityInputSchema},
  output: {schema: ClassifyZoneDensityOutputSchema},
  prompt: `You are an expert in crowd management. You are given the number of users in a zone, the maximum capacity of the zone and the GPS coordinates of the zone. You must classify the zone's crowd density into one of the following categories: over-crowded, crowded, moderate, free. Provide a brief justification for your classification.

Zone ID: {{{zoneId}}}
User Count: {{{userCount}}}
Capacity: {{{capacity}}}
Coordinates: {{{JSONstringify coordinates}}}

Respond with a JSON object that contains the densityCategory (one of: over-crowded, crowded, moderate, free) and a justification for the classification. The classification should be based on the user count relative to the capacity, and consider that people may feel crowded even at low density.

For example, a zone with a user count of 80 and capacity of 100, can be considered crowded, and a zone with 95 users can be considered over-crowded. Similarly, a zone with user count of 2 and capacity of 100 can be considered free.
`,
});

const classifyZoneDensityFlow = ai.defineFlow(
  {
    name: 'classifyZoneDensityFlow',
    inputSchema: ClassifyZoneDensityInputSchema,
    outputSchema: ClassifyZoneDensityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
