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
import type { Zone } from '@/lib/types';

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

// Point-in-polygon algorithm to check if a point is inside a zone
function isPointInZone(point: { latitude: number; longitude: number }, zone: Zone): boolean {
  let isInside = false;
  const vertices = zone.coordinates;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].lat, yi = vertices[i].lng;
    const xj = vertices[j].lat, yj = vertices[j].lng;

    const intersect = ((yi > point.longitude) !== (yj > point.longitude))
        && (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}


function findZoneForCoordinates(latitude: number, longitude: number): { zoneId: string; zoneName: string } {
    const zones = db.getZones();
    for (const zone of zones) {
        // A zone is defined by at least 3 coordinates.
        if (zone.coordinates && zone.coordinates.length > 2) {
             const isInside = isPointInZone({ latitude, longitude }, zone);
             if (isInside) {
                return { zoneId: zone.id, zoneName: zone.name };
            }
        }
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
  prompt: `You are a GPS zone detector. Given the user's latitude and longitude, and a list of zones with their polygon coordinates, determine which zone the user is currently in.

User Location:
Latitude: {{{latitude}}}
Longitude: {{{longitude}}}

Available Zones (defined by polygon vertices):
{{{JSONstringify zones}}}

Based on the user's location, identify the zone they are in. If the user's coordinates fall within the boundaries of a zone, return that zone's ID and name. If the user is not in any of the defined zones, return "unknown" for the zoneId and "Unknown" for the zoneName. Your determination should be based on checking if the point is inside one of the polygons.`,
});


const identifyUserZoneFlow = ai.defineFlow(
  {
    name: 'identifyUserZoneFlow',
    inputSchema: IdentifyUserZoneInputSchema,
    outputSchema: IdentifyUserZoneOutputSchema,
  },
  async (input) => {
    // Deterministic code is better for geographic calculations.
    const result = findZoneForCoordinates(input.latitude, input.longitude);
    
    // We only use the LLM as a fallback if our primary logic fails, 
    // which it shouldn't in this case, but it's good practice.
    if (result.zoneId !== 'unknown') {
        return result;
    }

    // If our simple logic fails, we can ask the LLM.
    const zones = db.getZones();
    const { output } = await prompt({ ...input, zones });
    return output!;
  }
);
