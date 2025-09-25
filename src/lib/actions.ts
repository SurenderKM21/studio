
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './data';
import type { Zone, AppSettings, DensityCategory, RouteDetails } from './types';
import { generateOptimalRoute } from '@/ai/flows/generate-optimal-route';
import { classifyZoneDensity } from '@/ai/flows/classify-zone-density';
import { suggestAlternativeRoutes } from '@/ai/flows/suggest-alternative-routes';
import { identifyUserZone } from '@/ai/flows/identify-user-zone';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z.string().min(1, 'Coordinate 1 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate2: z.string().min(1, 'Coordinate 2 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate3: z.string().min(1, 'Coordinate 3 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate4: z.string().min(1, 'Coordinate 4 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
});

export async function addZoneAction(prevState: any, formData: FormData) {
  const validatedFields = addZoneSchema.safeParse({
    name: formData.get('name'),
    capacity: formData.get('capacity'),
    coordinate1: formData.get('coordinate1'),
    coordinate2: formData.get('coordinate2'),
    coordinate3: formData.get('coordinate3'),
    coordinate4: formData.get('coordinate4'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { name, capacity, coordinate1, coordinate2, coordinate3, coordinate4 } = validatedFields.data;

  try {
    const coordsStrings = [coordinate1, coordinate2, coordinate3, coordinate4];
    const coordinates = coordsStrings
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
    revalidatePath('/user');
    return { success: true };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: message };
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

// A simple pathfinding algorithm (e.g., Breadth-First Search)
function findPath(startId: string, endId: string, zones: Zone[]): { path: string[], congestion: DensityCategory[] } {
  const queue: { id: string; path: string[]; congestion: DensityCategory[] }[] = [{ id: startId, path: [startId], congestion: [zones.find(z=>z.id === startId)!.density] }];
  const visited = new Set<string>([startId]);

  // For a simple grid, we can assume adjacency. 
  // In a real-world scenario, you'd have a graph of connected zones.
  const getNeighbors = (zoneId: string) => zones.map(z => z.id).filter(id => id !== zoneId);

  while (queue.length > 0) {
    const { id, path, congestion } = queue.shift()!;

    if (id === endId) {
      return { path, congestion };
    }

    const neighbors = getNeighbors(id);
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const neighborZone = zones.find(z => z.id === neighborId);
        if (neighborZone) {
            const newPath = [...path, neighborId];
            const newCongestion = [...congestion, neighborZone.density];
            queue.push({ id: neighborId, path: newPath, congestion: newCongestion });
        }
      }
    }
  }

  return { path: [], congestion: [] }; // No path found
}


function getOverallCongestion(congestionLevels: DensityCategory[]): string {
    if (congestionLevels.some(c => c === 'over-crowded')) return 'high';
    if (congestionLevels.some(c => c === 'crowded')) return 'high';
    if (congestionLevels.some(c => c === 'moderate')) return 'moderate';
    return 'low';
}


export async function getRouteAction(sourceZone: string, destinationZone: string) {
  if (!sourceZone || !destinationZone) {
    return { error: 'Source and destination zones are required.' };
  }

  try {
    const zones = db.getZones();
    const { path, congestion } = findPath(sourceZone, destinationZone, zones);

    if (path.length === 0) {
      return { error: 'No route could be found between the selected zones.' };
    }
    
    // In this simplified version, we just create a direct path.
    // A real implementation would use a proper pathfinding algorithm (like BFS or Dijkstra) on a graph of zones.
    const directRoute: RouteDetails = {
      route: [sourceZone, destinationZone],
      congestionLevel: 'low', // Placeholder
      alternativeRouteAvailable: false
    };

    const sourceZoneData = zones.find(z => z.id === sourceZone);
    const destZoneData = zones.find(z => z.id === destinationZone);
    
    if (!sourceZoneData || !destZoneData) {
      return { error: 'Could not find zone data.' };
    }

    const simplePath = [sourceZone, destinationZone];
    const congestionLevels = simplePath.map(id => zones.find(z=>z.id === id)!.density);

    const result: RouteDetails = {
        route: simplePath,
        congestionLevel: getOverallCongestion(congestionLevels),
        alternativeRouteAvailable: false, // For simplicity, we don't calculate alternatives here
    };

    return { data: result };

  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate route. Please try again.' };
  }
}

export async function classifyAllZonesAction() {
  const zones = db.getZones();
  const users = db.getUsers();
  const settings = db.getSettings();
  
  try {
    const zoneUserCounts = zones.reduce((acc, zone) => {
        acc[zone.id] = 0;
        return acc;
    }, {} as Record<string, number>);

    for (const user of users) {
        if (user.lastLatitude && user.lastLongitude) {
            const userZone = await identifyUserZoneAction(
              user.lastLatitude, 
              user.lastLongitude,
              10, // Default accuracy
            );
            if (userZone.data && userZone.data.zoneId !== 'unknown') {
                zoneUserCounts[userZone.data.zoneId] += user.groupSize || 1;
            }
        }
    }

    for (const zone of zones) {
       const userCount = zoneUserCounts[zone.id];
       db.updateZone(zone.id, { userCount });

      const result = await classifyZoneDensity({
        zoneId: zone.id,
        userCount: userCount,
        capacity: zone.capacity,
        coordinates: zone.coordinates.map(c => ({latitude: c.lat, longitude: c.lng})),
      });
      
      db.updateZone(zone.id, { density: result.densityCategory });
    }
    revalidatePath('/user');
    revalidatePath('/admin');
    return { success: true };
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

export async function identifyUserZoneAction(latitude: number, longitude: number, accuracy: number) {
    // try {
    //     const settings = db.getSettings();
    //     const result = await identifyUserZone({ latitude, longitude, accuracy, snappingThreshold: settings.zoneSnappingThreshold || 15 });
    //     return { data: result };
    // } catch (e) {
    //     const message = e instanceof Error ? e.message : 'An unexpected error occurred.';
    //     return { error: `Failed to identify user zone: ${message}` };
    // }
    // Hardcoded response to avoid API calls for now.
    const homeZone = db.getZones().find(z => z.name === 'Home');
    if (homeZone) {
      return Promise.resolve({ data: { zoneId: homeZone.id, zoneName: homeZone.name } });
    }
    // Fallback if "Home" zone doesn't exist
    return Promise.resolve({ data: { zoneId: 'zone-fzrs6wb', zoneName: 'Home' } });
}

export async function updateUserLocationAction(id: string, name: string, latitude: number, longitude: number, groupSize: number) {
  try {
    db.updateUserLocation(id, name, latitude, longitude, groupSize);
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update user location.' };
  }
}
