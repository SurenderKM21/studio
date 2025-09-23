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
{{json zones}}

Based on the user's location, identify the zone they are in. Your determination must be based on a point-in-polygon test. If the user's coordinates fall within the boundaries of a zone, return that zone's ID and name. If the user is not in any of the defined zones, return "unknown" for the zoneId and "Unknown" for the zoneName.`,
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
