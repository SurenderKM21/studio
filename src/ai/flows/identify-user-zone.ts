'use server';

/**
 * @fileOverview Identifies which zone a user is in based on their GPS coordinates.
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

// For simplicity, we are not using a tool here.
// A real-world implementation might use a spatial database or a more complex geometric calculation.
function findZoneForCoordinates(latitude: number, longitude: number): { zoneId: string; zoneName: string } {
    const zones = db.getZones();
    // This is a simplified logic. It finds the closest zone center.
    // A real implementation would check if the point is within the zone's polygon boundary.
    let closestZone: { id: string; name: string; distance: number } | null = null;

    for (const zone of zones) {
        // Using the first coordinate as the center for simplicity
        const zoneLat = zone.coordinates[0].lat;
        const zoneLng = zone.coordinates[0].lng;

        const distance = Math.sqrt(Math.pow(latitude - zoneLat, 2) + Math.pow(longitude - zoneLng, 2));

        if (!closestZone || distance < closestZone.distance) {
            closestZone = { id: zone.id, name: zone.name, distance: distance };
        }
    }
    
    // Define a threshold for how close the user needs to be to be "in" a zone.
    // This is a naive implementation.
    const distanceThreshold = 0.001;
    if (closestZone && closestZone.distance < distanceThreshold) {
        return { zoneId: closestZone.id, zoneName: closestZone.name };
    }

    return { zoneId: 'unknown', zoneName: 'Unknown' };
}

const prompt = ai.definePrompt({
  name: 'identifyUserZonePrompt',
  input: {schema: z.object({
      latitude: z.number(),
      longitude: z.number(),
      zones: z.any(),
  })},
  output: {schema: IdentifyUserZoneOutputSchema},
  prompt: `You are a GPS zone detector. Given the user's latitude and longitude, and a list of zones with their coordinates, determine which zone the user is currently in.

User Location:
Latitude: {{{latitude}}}
Longitude: {{{longitude}}}

Available Zones:
{{{JSONstringify zones}}}

Based on the user's location, identify the zone they are in. The zones are defined by the coordinates provided. If the user's coordinates fall within the boundaries of a zone, return that zone's ID and name. If the user is not in any of the defined zones, return "unknown" for the zoneId and "Unknown" for the zoneName. Your determination should be based on proximity.`,
});


const identifyUserZoneFlow = ai.defineFlow(
  {
    name: 'identifyUserZoneFlow',
    inputSchema: IdentifyUserZoneInputSchema,
    outputSchema: IdentifyUserZoneOutputSchema,
  },
  async (input) => {
    // Note: The LLM is good, but for geographic calculations, deterministic code is better.
    // We will use the LLM as a fallback or for more complex reasoning if needed,
    // but the primary logic will be in our TypeScript function.
    const result = findZoneForCoordinates(input.latitude, input.longitude);
    
    if (result.zoneId !== 'unknown') {
        return result;
    }

    // If our simple logic fails, we can ask the LLM.
    const zones = db.getZones();
    const { output } = await prompt({ ...input, zones });
    return output!;
  }
);
