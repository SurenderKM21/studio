
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './data';
import type { Zone, AppSettings, DensityCategory, RouteDetails, Coordinate } from './types';
import { redirect } from 'next/navigation';

const coordinateRegex = /^-?\d+(\.\d+)?,\s?-?\d+(\.\d+)?$/;

const addZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z.string().min(1, 'Coordinate 1 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate2: z.string().min(1, 'Coordinate 2 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate3: z.string().min(1, 'Coordinate 3 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
  coordinate4: z.string().min(1, 'Coordinate 4 is required').regex(coordinateRegex, 'Invalid format, use "lat,lng"'),
});

const updateZoneSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  coordinate1: z.string().regex(coordinateRegex, 'Invalid format, use "lat,lng"').optional().or(z.literal('')),
  coordinate2: z.string().regex(coordinateRegex, 'Invalid format, use "lat,lng"').optional().or(z.literal('')),
  coordinate3: z.string().regex(coordinateRegex, 'Invalid format, use "lat,lng"').optional().or(z.literal('')),
  coordinate4: z.string().regex(coordinateRegex, 'Invalid format, use "lat,lng"').optional().or(z.literal('')),
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

export async function updateZoneAction(zoneId: string, data: z.infer<typeof updateZoneSchema>) {
    const validatedFields = updateZoneSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { name, capacity, coordinate1, coordinate2, coordinate3, coordinate4 } = validatedFields.data;

    try {
        const updateData: Partial<Zone> = {};
        if (name) updateData.name = name;
        if (capacity) updateData.capacity = capacity;

        const coordsStrings = [coordinate1, coordinate2, coordinate3, coordinate4].filter(Boolean) as string[];
        if (coordsStrings.length > 0) {
            if (coordsStrings.length < 3) {
                return { error: 'A zone must have at least 3 coordinates if you are updating them.' };
            }
             const coordinates = coordsStrings
                .map(pair => {
                    const [lat, lng] = pair.trim().split(',').map(Number);
                    if (isNaN(lat) || isNaN(lng)) {
                        throw new Error('Invalid coordinate format.');
                    }
                    return { lat, lng };
                });
            updateData.coordinates = coordinates;
        }

        db.updateZone(zoneId, updateData);
        revalidatePath('/admin');
        revalidatePath('/user');
        return { success: true };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return { error: message };
    }
}


export async function deleteZoneAction(zoneId: string) {
  try {
    db.deleteZone(zoneId);
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
  db.updateZone(zoneId, { density: density, manualDensity: true });
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
    const epsilon = 2e-4; // Looser tolerance for adjacency check (approx 22 meters)

    const latOverlap = box1.maxLat >= box2.minLat - epsilon && box1.minLat <= box2.maxLat + epsilon;
    const lngOverlap = box1.maxLng >= box2.minLng - epsilon && box1.minLng <= box2.maxLng + epsilon;
    
    return latOverlap && lngOverlap;
}

// Dijkstra's algorithm to find the shortest path considering congestion
function findPath(startId: string, endId: string, zones: Zone[], useCongestion: boolean = true): string[] {
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
            const neighborZone = zones.find(z => z.id === neighborId);
            if (!neighborZone) return;

            const cost = useCongestion ? (DENSITY_COST[neighborZone.density] || 1) : 1;
            const newCost = costs[currentId] + cost;

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
    
    // 1. Find the path using congestion costs (this is the optimal path).
    const optimalPath = findPath(sourceZone, destinationZone, zones, true);

    if (optimalPath.length === 0) {
      return { error: 'No route could be found between the selected zones.' };
    }

    // 2. Find the shortest physical path, ignoring congestion. This is our baseline "crowded" path.
    const directPath = findPath(sourceZone, destinationZone, zones, false);

    const optimalCongestion = getOverallCongestion(optimalPath, zones);

    // 3. If the optimal path is different from the direct path, it means we found a better route.
    const isAlternativeAvailable = JSON.stringify(optimalPath) !== JSON.stringify(directPath);

    if (isAlternativeAvailable) {
        const result: RouteDetails = {
            route: optimalPath,
            congestionLevel: optimalCongestion,
            alternativeRouteAvailable: true,
            alternativeRoute: directPath, // The direct (but crowded) path is the alternative
        };
        return { data: result };
    }


    // If no alternative was needed or found, return the initial path.
    const result: RouteDetails = {
        route: optimalPath,
        congestionLevel: optimalCongestion,
        alternativeRouteAvailable: false,
    };

    return { data: result };

  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate route. Please try again.' };
  }
}

// Hardcoded density classification
function classifyDensityHardcoded(userCount: number, capacity: number): DensityCategory {
  if (capacity <= 0) return 'free'; // Avoid division by zero
  const ratio = userCount / capacity;

  if (ratio > 1) {
    return 'over-crowded';
  }
  if (ratio >= 0.8) {
    return 'crowded';
  }
  if (ratio > 0.5) {
    return 'moderate';
  }
  return 'free';
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
            const userZoneResult = identifyUserZone(user.lastLatitude, user.lastLongitude, zones);
            if (userZoneResult && userZoneResult.zoneId !== 'unknown') {
                zoneUserCounts[userZoneResult.zoneId] += user.groupSize || 1;
            }
        }
    }

    for (const zone of zones) {
       const userCount = zoneUserCounts[zone.id];
       // Reclassify only if user count has changed.
       if (zone.userCount !== userCount) {
         const newDensity = classifyDensityHardcoded(userCount, zone.capacity);
         db.updateZone(zone.id, { userCount, density: newDensity, manualDensity: false });
       }
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


// Internal function, not a server action
function identifyUserZone(latitude: number, longitude: number, zones: Zone[]) {
    const userPoint = { lat: latitude, lng: longitude };
    for (const zone of zones) {
        if (isPointInPolygon(userPoint, zone.coordinates)) {
            return { zoneId: zone.id, zoneName: zone.name };
        }
    }
    // Implement snapping logic if user is outside all zones
    const settings = db.getSettings();
    const snappingThreshold = settings.zoneSnappingThreshold; // meters

    if (snappingThreshold !== undefined && snappingThreshold > 0) {
        let closestZone: Zone | null = null;
        let minDistance = Infinity;

        for (const zone of zones) {
            const center = getZoneCenter(zone);
            const distance = getHaversineDistance(userPoint, center);

            if (distance < minDistance) {
                minDistance = distance;
                closestZone = zone;
            }
        }

        if (closestZone && minDistance <= snappingThreshold) {
            return { zoneId: closestZone.id, zoneName: `Near ${closestZone.name}` };
        }
    }

    return { zoneId: 'unknown', zoneName: 'Unknown' };
}

function getZoneCenter(zone: Zone): Coordinate {
    const lats = zone.coordinates.map(c => c.lat);
    const lngs = zone.coordinates.map(c => c.lng);
    return {
        lat: lats.reduce((a, b) => a + b) / lats.length,
        lng: lngs.reduce((a, b) => a + b) / lngs.length,
    };
}


function getHaversineDistance(point1: Coordinate, point2: Coordinate): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = point1.lat * Math.PI / 180;
    const phi2 = point2.lat * Math.PI / 180;
    const deltaPhi = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLambda = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}


export async function updateUserLocationAndClassifyZonesAction(userId: string, userName: string, latitude: number, longitude: number, groupSize: number) {
  try {
    // 1. Update the current user's location
    db.updateUserLocation(userId, userName, latitude, longitude, groupSize);

    // 2. Recalculate counts and densities for all zones
    const zones = db.getZones();
    const users = db.getUsers();
    
    const zoneUserCounts = zones.reduce((acc, zone) => {
        acc[zone.id] = 0;
        return acc;
    }, {} as Record<string, number>);

    for (const user of users) {
        if (user.lastLatitude && user.lastLongitude) {
            const userZoneResult = identifyUserZone(user.lastLatitude, user.lastLongitude, zones);
            if (userZoneResult && userZoneResult.zoneId !== 'unknown') {
                zoneUserCounts[userZoneResult.zoneId] += user.groupSize || 1;
            }
        }
    }

    for (const zone of zones) {
       const newUserCount = zoneUserCounts[zone.id];
       
       // Only re-classify if the user count has actually changed.
       if (zone.userCount !== newUserCount) {
         // If count has changed, automatic classification takes over.
         const newDensity = classifyDensityHardcoded(newUserCount, zone.capacity);
         // Setting manualDensity to false because this is an automatic update.
         db.updateZone(zone.id, { userCount: newUserCount, density: newDensity, manualDensity: false });
       }
    }

    // 3. Re-fetch the updated zones and find the current user's new zone
    const updatedZones = db.getZones();
    const currentUserZone = identifyUserZone(latitude, longitude, updatedZones);

    revalidatePath('/user');
    revalidatePath('/admin');
    
    // 4. Return all necessary data to the client
    return { 
      success: true, 
      data: {
        zones: updatedZones,
        currentZone: currentUserZone
      }
    };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update user location and re-classify zones.' };
  }
}

export async function logoutUserAction(userId: string) {
    try {
        db.removeUser(userId);
        await classifyAllZonesAction();
        revalidatePath('/user');
        revalidatePath('/admin');
    } catch(e) {
        console.error("Error during logout:", e);
    }
    redirect('/');
}

    
