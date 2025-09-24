'use server';

/**
 * @fileOverview Identifies which zone a user is in based on their GPS coordinates, with snapping logic.
 *
 * - identifyUserZone - A function that identifies the user's current zone.
 * - IdentifyUserZoneInput - The input type for the identifyUserZone function.
 * - IdentifyUserZoneOutput - The return type for the identifyUserZone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
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
  prompt: `You are a sophisticated GPS zone detector for a large event. Your task is to determine which zone a user is in based on their location coordinates.

You must follow this logic precisely:
1.  **Point-in-Polygon Test**: First, determine if the user's coordinates (latitude, longitude) fall directly within the boundaries of any of the provided zone polygons. If they do, return that zone's ID and name immediately.
2.  **Zone Snapping (If Outside)**: If the point is NOT inside any polygon (due to GPS drift, etc.), you must then find the closest zone to the user.
    a. Calculate the distance from the user's coordinates to the center of EACH zone.
    b. Identify the zone with the shortest distance.
    c. Compare this shortest distance to the 'snappingThreshold'.
    d. If the distance is LESS THAN OR EQUAL to the 'snappingThreshold', "snap" the user to that zone by returning its ID and name.
3.  **Unknown Zone**: If the user is not inside any zone polygon AND the distance to the nearest zone is GREATER than the 'snappingThreshold', you must return "unknown" for the zoneId and "Unknown" for the zoneName.

User's Location:
- Latitude: {{{latitude}}}
- Longitude: {{{longitude}}}
- Accuracy: {{{accuracy}}} meters

Configuration:
- Snapping Threshold: {{{snappingThreshold}}} meters

Available Zones (defined by polygon vertices):
{{{json zones}}}

Execute the logic and return the determined zone.`,
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
