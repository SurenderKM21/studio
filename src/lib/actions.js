'use server';

import { redirect } from 'next/navigation';

/**
 * Server Actions for EvacAI.
 * Dijkstra's algorithm for density-weighted pathfinding.
 */

const DENSITY_COST = {
    'free': 1,
    'moderate': 3,
    'crowded': 10,
    'over-crowded': 100
};

function getBoundingBox(zone) {
    const lats = zone.coordinates.map((c) => c.lat);
    const lngs = zone.coordinates.map((c) => c.lng);
    return {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
    };
}

function areZonesAdjacent(zone1, zone2) {
    const box1 = getBoundingBox(zone1);
    const box2 = getBoundingBox(zone2);
    const epsilon = 2e-4;

    const latOverlap = box1.maxLat >= box2.minLat - epsilon && box1.minLat <= box2.maxLat + epsilon;
    const lngOverlap = box1.maxLng >= box2.minLng - epsilon && box1.minLng <= box2.maxLng + epsilon;
    
    return latOverlap && lngOverlap;
}

export async function loginUserAction(data) {
    const { role, username, email } = data;
    const loginTimestamp = new Date().toISOString();
    let userId;

    if (role === 'admin') {
        if (!email) return { success: false, error: 'Admin email is required.' };
        userId = email.split('@')[0].toLowerCase();
    } else if (username) {
        userId = username.toLowerCase().replace(/\s/g, '-') || `user-${Math.random().toString(36).substring(2, 9)}`;
    } else {
        return { success: false, error: 'Invalid login details.' };
    }

    const encodedUserId = Buffer.from(userId).toString('base64');
    return { success: true, userId: encodedUserId, role: role, loginTimestamp };
}

export async function logoutUserAction(userId) {
    redirect('/');
}

export async function getRouteAction(sourceZone, destinationZone, zones) {
  if (!sourceZone || !destinationZone || !zones || zones.length === 0) {
    return { error: 'Source, destination, and zones are required.' };
  }

  const findPath = (startId, endId, allZones, useCongestion = true) => {
    const costs = {};
    const previous = {};
    const queue = [];
    const adjacencyList = {};

    allZones.forEach(zone => {
      costs[zone.id] = Infinity;
      previous[zone.id] = null;
      adjacencyList[zone.id] = [];
    });

    for (let i = 0; i < allZones.length; i++) {
      for (let j = i + 1; j < allZones.length; j++) {
        if (areZonesAdjacent(allZones[i], allZones[j])) {
          adjacencyList[allZones[i].id].push(allZones[j].id);
          adjacencyList[allZones[j].id].push(allZones[i].id);
        }
      }
    }

    costs[startId] = 0;
    queue.push(startId);

    while (queue.length > 0) {
      queue.sort((a, b) => costs[a] - costs[b]);
      const currentId = queue.shift();

      if (currentId === endId) {
        const path = [];
        let current = endId;
        while (current) {
          path.unshift(current);
          current = previous[current];
        }
        return path;
      }

      if (!adjacencyList[currentId]) continue;

      adjacencyList[currentId].forEach(neighborId => {
        const neighborZone = allZones.find(z => z.id === neighborId);
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
    return [];
  };

  const getOverallCongestion = (path, allZones) => {
    let totalCost = 0;
    for (const zoneId of path) {
      const zone = allZones.find(z => z.id === zoneId);
      if (zone) totalCost += (DENSITY_COST[zone.density] || 1);
    }
    if (totalCost >= 10 * path.length / 2) return 'high';
    if (totalCost > path.length) return 'moderate';
    return 'low';
  };

  try {
    const optimalPath = findPath(sourceZone, destinationZone, zones, true);
    if (optimalPath.length === 0) return { error: 'No route found.' };

    const directPath = findPath(sourceZone, destinationZone, zones, false);
    const optimalCongestion = getOverallCongestion(optimalPath, zones);
    const isAlternativeAvailable = JSON.stringify(optimalPath) !== JSON.stringify(directPath);

    return { 
      data: {
        route: optimalPath,
        congestionLevel: optimalCongestion,
        alternativeRouteAvailable: isAlternativeAvailable,
        alternativeRoute: isAlternativeAvailable ? directPath : undefined,
      }
    };
  } catch (e) {
    return { error: 'Failed to generate route.' };
  }
}
