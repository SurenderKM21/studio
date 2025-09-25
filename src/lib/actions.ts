
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './data';
import type { Zone, AppSettings, DensityCategory, RouteDetails, Coordinate } from './types';
import { classifyZoneDensity } from '@/ai/flows/classify-zone-density';

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


// --- Logic-based Pathfinding ---

const DENSITY_COST: Record<DensityCategory, number> = {
    'free': 1,
    'moderate': 3,
    'crowded': 10,
    'over-crowded': 100
};
const HIGH_CONGESTION_THRESHOLD = 10;

type BoundingBox = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

function getBoundingBox(zone: Zone): BoundingBox {
    const lats = zone.coordinates.map(c => c.lat);
    const lngs = zone.coordinates.map(c => c.lng);
    return {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
    };
}

// Check if two zones are adjacent by checking if their bounding boxes are close or overlapping.
function areZonesAdjacent(zone1: Zone, zone2: Zone): boolean {
    const box1 = getBoundingBox(zone1);
    const box2 = getBoundingBox(zone2);
    const epsilon = 1e-4; // Looser tolerance for adjacency check

    // Check if boxes are separate
    const separate = 
        box1.maxLat < box2.minLat - epsilon ||
        box1.minLat > box2.maxLat + epsilon ||
        box1.maxLng < box2.minLng - epsilon ||
        box1.minLng > box2.maxLng + epsilon;

    return !separate;
}

// Dijkstra's algorithm to find the shortest path considering congestion
function findPath(startId: string, endId: string, zones: Zone[], excludedZones: Set<string> = new Set()): string[] {
    const costs: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const queue: string[] = [];
    const adjacencyList: { [key: string]: string[] } = {};

    zones.forEach(zone => {
        costs[zone.id] = Infinity;
        previous[zone.id] = null;
        adjacencyList[zone.id] = [];
    });

    // Build adjacency list
    for (let i = 0; i < zones.length; i++) {
        for (let j = i + 1; j < zones.length; j++) {
            if (areZonesAdjacent(zones[i], zones[j])) {
                adjacencyList[zones[i].id].push(zones[j].id);
                adjacencyList[zones[j].id].push(zones[i].id);
            }
        }
    }

    costs[startId] = 0;
    queue.push(startId);

    while (queue.length > 0) {
        queue.sort((a, b) => costs[a] - costs[b]);
        const currentId = queue.shift()!;

        if (currentId === endId) {
            const path: string[] = [];
            let current = endId;
            while (current) {
                path.unshift(current);
                current = previous[current]!;
            }
            return path;
        }

        if (!adjacencyList[currentId]) continue;

        adjacencyList[currentId].forEach(neighborId => {
             if (excludedZones.has(neighborId)) return;

            const neighborZone = zones.find(z => z.id === neighborId);
            if (!neighborZone) return;

            const newCost = costs[currentId] + (DENSITY_COST[neighborZone.density] || 1);
            if (newCost < costs[neighborId]) {
                costs[neighborId] = newCost;
                previous[neighborId] = currentId;
                if (!queue.includes(neighborId)) {
                    queue.push(neighborId);
                }
            }
        });
    }

    return []; // No path found
}


function getOverallCongestion(path: string[], zones: Zone[]): string {
    let totalCost = 0;
    for (const zoneId of path) {
        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
            totalCost += (DENSITY_COST[zone.density] || 1);
        }
    }
    if (totalCost >= HIGH_CONGESTION_THRESHOLD * path.length / 2) return 'high';
    if (totalCost > path.length) return 'moderate';
    return 'low';
}


export async function getRouteAction(sourceZone: string, destinationZone: string) {
  if (!sourceZone || !destinationZone) {
    return { error: 'Source and destination zones are required.' };
  }

  try {
    const zones = db.getZones();
    const optimalPath = findPath(sourceZone, destinationZone, zones);

    if (optimalPath.length === 0) {
      return { error: 'No route could be found between the selected zones.' };
    }
    
    const congestionLevel = getOverallCongestion(optimalPath, zones);
    const result: RouteDetails = {
        route: optimalPath,
        congestionLevel: congestionLevel,
        alternativeRouteAvailable: false,
    };
    
    // If the main route is congested, try to find an alternative
    if (congestionLevel === 'high') {
        const highlyCongestedZones = new Set(
            optimalPath.filter(zoneId => {
                const zone = zones.find(z => z.id === zoneId);
                return zone && (zone.density === 'over-crowded' || zone.density === 'crowded');
            })
        );

        const alternativePath = findPath(sourceZone, destinationZone, zones, highlyCongestedZones);
        if (alternativePath.length > 0 && JSON.stringify(alternativePath) !== JSON.stringify(optimalPath)) {
            result.alternativeRouteAvailable = true;
            result.alternativeRoute = alternativePath;
        }
    }

    return { data: result };

  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate route. Please try again.' };
  }
}

export async function classifyAllZonesAction() {
  const zones = db.getZones();
  const users = db.getUsers();
  
  try {
    const zoneUserCounts = zones.reduce((acc, zone) => {
        acc[zone.id] = 0;
        return acc;
    }, {} as Record<string, number>);

    for (const user of users) {
        if (user.lastLatitude && user.lastLongitude) {
            const userZoneResult = await identifyUserZoneAction(
              user.lastLatitude, 
              user.lastLongitude,
              10, // Default accuracy
            );
            if (userZoneResult.data && userZoneResult.data.zoneId !== 'unknown') {
                zoneUserCounts[userZoneResult.data.zoneId] += user.groupSize || 1;
            }
        }
    }

    for (const zone of zones) {
       const userCount = zoneUserCounts[zone.id];
       db.updateZone(zone.id, { userCount });

      // This still uses AI, but the routing part does not.
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

// Check if a point is inside a polygon using the ray-casting algorithm
function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        const intersect = ((yi > point.lng) !== (yj > point.lng))
            && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}


export async function identifyUserZoneAction(latitude: number, longitude: number, accuracy: number) {
    try {
        const zones = db.getZones();
        const userPoint = { lat: latitude, lng: longitude };

        for (const zone of zones) {
            if (isPointInPolygon(userPoint, zone.coordinates)) {
                return { data: { zoneId: zone.id, zoneName: zone.name } };
            }
        }
        
        // If not in any zone, find the closest one within a snapping threshold (optional, simplified for now)
        // For now, we just return unknown if not directly inside any zone.

        return { data: { zoneId: 'unknown', zoneName: 'Unknown' } };
    } catch (e) {
        console.error("Failed to identify user zone:", e);
        return { error: "Failed to identify user zone." };
    }
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
