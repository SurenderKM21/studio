'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './data';
import type { Zone, AppSettings, DensityCategory } from './types';
import { generateOptimalRoute } from '@/ai/flows/generate-optimal-route';
import { classifyZoneDensity } from '@/ai/flows/classify-zone-density';
import { suggestAlternativeRoutes } from '@/ai/flows/suggest-alternative-routes';
import { identifyUserZone } from '@/ai/flows/identify-user-zone';


const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinates: z.string().min(1, 'Coordinates are required'),
});

export async function addZoneAction(prevState: any, formData: FormData) {
  const validatedFields = addZoneSchema.safeParse({
    name: formData.get('name'),
    capacity: formData.get('capacity'),
    coordinates: formData.get('coordinates'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { name, capacity, coordinates: coordsString } = validatedFields.data;

  try {
    const coordinates = coordsString
      .split(';')
      .map(pair => {
        const [lat, lng] = pair.trim().split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinate format.');
        }
        return { lat, lng };
      });
      
    if (coordinates.length < 3) {
       return { error: 'A zone must have at least 3 coordinates.' };
    }

    db.addZone({ name, capacity, coordinates });
    revalidatePath('/admin');
    return { success: true };

  } catch (error) {
    return { error: 'Invalid coordinate string format. Use "lat,lng; lat,lng; ..."' };
  }
}

export async function updateSettingsAction(settings: Partial<AppSettings>) {
  db.updateSettings(settings);
  revalidatePath('/admin');
  revalidatePath('/user');
}

export async function manualUpdateDensityAction(
  zoneId: string,
  density: DensityCategory
) {
  db.updateZoneDensity(zoneId, density);
  revalidatePath('/admin');
  revalidatePath('/user');
}

export async function getRouteAction(sourceZone: string, destinationZone: string) {
  if (!sourceZone || !destinationZone) {
    return { error: 'Source and destination zones are required.' };
  }

  try {
    const result = await generateOptimalRoute({
      sourceZone,
      destinationZone,
      // The AI flow expects a base64 data URI for location.
      // This is a placeholder for a user's actual location.
      currentLocation: 'data:text/plain;base64,MzQuMDUyMiwtMTE4LjI0Mzc=',
    });
    return { data: result };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate route. Please try again.' };
  }
}

export async function classifyAllZonesAction() {
  const zones = db.getZones();
  const classifications: { zoneId: string; density: DensityCategory }[] = [];
  
  try {
    for (const zone of zones) {
       // Simulate user count changes
       const userCount = Math.floor(Math.random() * (zone.capacity * 1.2));
       db.updateZone(zone.id, { userCount });

      const result = await classifyZoneDensity({
        zoneId: zone.id,
        userCount: userCount,
        capacity: zone.capacity,
        coordinates: zone.coordinates.map(c => ({latitude: c.lat, longitude: c.lng})),
      });
      
      db.updateZone(zone.id, { density: result.densityCategory });
      classifications.push({ zoneId: zone.id, density: result.densityCategory });
    }
    revalidatePath('/user');
    return { success: true, classifications };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to classify zone densities.' };
  }
}

export async function getAlternativeRoutesAction(sourceZone: string, destinationZone: string, currentRoute: string[]) {
    const zones = db.getZones();
    const congestionData = zones.reduce((acc, zone) => {
        acc[zone.id] = zone.density;
        return acc;
    }, {} as Record<string, string>);

    try {
        const result = await suggestAlternativeRoutes({
            sourceZone,
            destinationZone,
            currentRoute,
            congestionData,
        });
        return { data: result };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to suggest alternative routes.' };
    }
}

export async function identifyUserZoneAction(latitude: number, longitude: number) {
    try {
        const result = await identifyUserZone({ latitude, longitude });
        return { data: result };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to identify user zone.' };
    }
}
