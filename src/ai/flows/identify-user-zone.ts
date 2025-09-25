'use server';

/**
 * @fileOverview Identifies which zone a user is in based on their GPS coordinates, with snapping logic.
 *
 * - identifyUserZone - A function that identifies the user's current zone.
 * - IdentifyUserZoneInput - The input type for the identifyUserZone function.
 * - IdentifyUserZoneOutput - The return type for the identifyUserZone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { db } from '@/lib/data';

const IdentifyUserZoneInputSchema = z.object({
    latitude: z.number().describe('The latitude of the user.'),
    longitude: z.number().describe('The longitude of the user.'),
    accuracy: z.number().describe('The accuracy of the location reading in meters.'),
    snappingThreshold: z.number().describe('The maximum distance in meters to snap to a nearby zone.')
});

export type IdentifyUserZoneInput = z.infer<typeof IdentifyUserZoneInputSchema>;

const IdentifyUserZoneOutputSchema = z.object({
    zoneId: z.string().describe('The ID of the zone the user is in. "unknown" if not in any zone.'),
    zoneName: z.string().describe('The name of the zone the user is in. "Unknown" if not in any zone.'),
});

export type IdentifyUserZoneOutput = z.infer<typeof IdentifyUserZoneOutputSchema>;

export async function identifyUserZone(input: IdentifyUserZoneInput): Promise<IdentifyUserZoneOutput> {
    return identifyUserZoneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyUserZonePrompt',
  input: {schema: z.object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number(),
      snappingThreshold: z.number(),
      zones: z.any(),
  })},
  output: {schema: IdentifyUserZoneOutputSchema},
  prompt: `You are a GPS zone detector. Determine which zone a user is in.

Logic:
1.  **Inside Zone?**: If user's lat/lng is inside a zone's polygon, return that zone's ID and name.
2.  **Snap to Zone?**: If not inside any zone, find the closest zone. If the distance to its center is <= 'snappingThreshold', return that zone's ID and name.
3.  **Unknown?**: Otherwise, return "unknown" for zoneId and "Unknown" for zoneName.

User Location:
- Latitude: {{{latitude}}}
- Longitude: {{{longitude}}}
- Snapping Threshold: {{{snappingThreshold}}} meters

Zones:
{{{json zones}}}

Return the result.`,
});


const identifyUserZoneFlow = ai.defineFlow(
  {
    name: 'identifyUserZoneFlow',
    inputSchema: IdentifyUserZoneInputSchema,
    outputSchema: IdentifyUserZoneOutputSchema,
  },
  async (input) => {
    const zones = db.getZones().map(zone => ({
      id: zone.id,
      name: zone.name,
      coordinates: zone.coordinates
    }));
    const { output } = await prompt({ ...input, zones });
    return output!;
  }
);
