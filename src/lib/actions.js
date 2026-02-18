'use server';

import { revalidatePath } from 'next/cache';
import { db } from './data';
import { redirect } from 'next/navigation';

// --- Helper Constants & Logic for Pathfinding (Dijkstra) ---

const DENSITY_COST = {
  'free': 1,
  'moderate': 3,
  'crowded': 10,
  'over-crowded': 100
};
const HIGH_CONGESTION_THRESHOLD = 10;

function getBoundingBox(zone) {
  const lats = zone.coordinates.map(c => c.lat);
  const lngs = zone.coordinates.map(c => c.lng);
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
  const epsilon = 2e-4; // Looser tolerance for adjacency check (approx 22 meters)

  const latOverlap = box1.maxLat >= box2.minLat - epsilon && box1.minLat <= box2.maxLat + epsilon;
  const lngOverlap = box1.maxLng >= box2.minLng - epsilon && box1.minLng <= box2.maxLng + epsilon;
  
  return latOverlap && lngOverlap;
}

function findPath(startId, endId, zones, useCongestion = true) {
  const costs = {};
  const previous = {};
  const queue = [];
  const adjacencyList = {};

  zones.forEach(zone => {
    costs[zone.id] = Infinity;
    previous[zone.id] = null;
    adjacencyList[zone.id] = [];
  });

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
  return [];
}

function getOverallCongestion(path, zones) {
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

function isPointInPolygon(point, polygon) {
  let isInside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > point.lng) !== (yj > point.lng))
      && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);

    if (intersect) {
      isInside = !isInside;
    }
  }
  return isInside;
}

function getZoneCenter(zone) {
  const lats = zone.coordinates.map(c => c.lat);
  const lngs = zone.coordinates.map(c => c.lng);
  return {
    lat: lats.reduce((a, b) => a + b) / lats.length,
    lng: lngs.reduce((a, b) => a + b) / lngs.length,
  };
}

function getHaversineDistance(point1, point2) {
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

function identifyUserZone(latitude, longitude, zones) {
  const userPoint = { lat: latitude, lng: longitude };
  for (const zone of zones) {
    if (isPointInPolygon(userPoint, zone.coordinates)) {
      return { zoneId: zone.id, zoneName: zone.name };
    }
  }
  const settings = db.getSettings();
  const snappingThreshold = settings.zoneSnappingThreshold;

  if (snappingThreshold !== undefined && snappingThreshold > 0) {
    let closestZone = null;
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

function classifyDensityHardcoded(userCount, capacity) {
  if (capacity <= 0) return 'free';
  const ratio = userCount / capacity;
  if (ratio >= 1) return 'over-crowded';
  if (ratio > 0.6) return 'crowded';
  if (ratio > 0.3) return 'moderate';
  return 'free';
}

function rebalanceAllZoneCounts() {
  const allZones = db.getZones();
  const allUsers = db.getUsers().filter(u => u.status === 'online');

  const zoneUserCounts = allZones.reduce((acc, zone) => {
    acc[zone.id] = 0;
    return acc;
  }, {});

  for (const user of allUsers) {
    if (user.lastLatitude && user.lastLongitude) {
      const userZoneResult = identifyUserZone(user.lastLatitude, user.lastLongitude, allZones);
      if (userZoneResult && userZoneResult.zoneId !== 'unknown') {
        zoneUserCounts[userZoneResult.zoneId] += user.groupSize || 1;
      }
    }
  }

  for (const zone of allZones) {
    const newUserCount = zoneUserCounts[zone.id];
    if (zone.userCount !== newUserCount) {
      const newDensity = classifyDensityHardcoded(newUserCount, zone.capacity);
      const isManual = zone.manualDensity;
      db.updateZone(zone.id, { 
        userCount: newUserCount, 
        density: newDensity, 
        manualDensity: isManual ? false : undefined 
      });
    }
  }
}

// --- Exported Server Actions ---

export async function getUserById(id) {
  try {
    return await db.getUserById(id);
  } catch (e) {
    console.error("Error in getUserById:", e);
    return null;
  }
}

export async function getZones() {
  return await db.getZones();
}

export async function getSettings() {
  return await db.getSettings();
}

export async function getUsers() {
  return await db.getUsers();
}

export async function loginUserAction(data) {
  const { role, username, email } = data;
  const loginTimestamp = new Date().toISOString();
  let userId;

  try {
    if (role === 'admin') {
      if (!email) return { success: false, error: 'Admin email is required.' };
      userId = email.split('@')[0].toLowerCase();
      await db.addUser({
        id: userId,
        name: 'Admin',
        groupSize: 1,
        lastSeen: loginTimestamp,
        role: 'admin',
        status: 'online'
      });
    } else if (username) {
      userId = username.toLowerCase().replace(/\s/g, '-') || `user-${Math.random().toString(36).substring(2, 9)}`;
      await db.addUser({
        id: userId,
        name: username,
        groupSize: 1,
        lastSeen: loginTimestamp,
        role: 'user',
        status: 'online'
      });
    } else {
      return { success: false, error: 'Invalid login details.' };
    }

    rebalanceAllZoneCounts();
    const encodedUserId = Buffer.from(userId).toString('base64');
    return { success: true, userId: encodedUserId, role, loginTimestamp };
  } catch (e) {
    return { success: false, error: 'Login failed: ' + e.message };
  }
}

export async function logoutUserAction(userId) {
  try {
    const decodedUserId = Buffer.from(userId, 'base64').toString('utf-8');
    await db.updateUser(decodedUserId, { status: 'offline' });
    rebalanceAllZoneCounts();
  } catch (e) {
    console.error("Error during logout:", e);
  }
  redirect('/');
}

export async function addZoneAction(prevState, formData) {
  try {
    const name = formData.get('name');
    const capacity = Number(formData.get('capacity'));
    const coordinates = JSON.parse(formData.get('coordinates') || '[]');
    
    if (coordinates.length < 3) {
      return { error: { coordinates: ['A zone must have at least 3 coordinates.'] } };
    }

    await db.addZone({ name, capacity, coordinates });
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    console.error("Add zone error:", e);
    return { error: e.message };
  }
}

export async function updateZoneAction(zoneId, data) {
  try {
    await db.updateZone(zoneId, data);
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteZoneAction(zoneId) {
  try {
    await db.deleteZone(zoneId);
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function sendAlertAction(message, zoneId) {
  try {
    await db.addAlert(message, zoneId);
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function toggleSOSAction(userId, sosState) {
  try {
    await db.updateUser(userId, { sos: sosState });
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function addZoneNoteAction(zoneId, noteText, visibleToUser) {
  try {
    await db.addNoteToZone(zoneId, noteText, visibleToUser);
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteZoneNoteAction(zoneId, noteId) {
  try {
    await db.deleteNoteFromZone(zoneId, noteId);
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function manualUpdateDensityAction(zoneId, density) {
  try {
    await db.updateZone(zoneId, { density, manualDensity: true });
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateSettingsAction(settings) {
  try {
    await db.updateSettings(settings);
    revalidatePath('/admin');
    revalidatePath('/user');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function removeUserAction(userId) {
  try {
    await db.removeUser(userId);
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function clearAllUsersAction() {
  try {
    await db.clearAllUsers();
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getLatestAlertAction() {
  try {
    const alert = await db.getLatestAlert();
    return { data: alert };
  } catch (e) {
    return { error: e.message };
  }
}

export async function getRouteAction(sourceZone, destinationZone) {
  if (!sourceZone || !destinationZone) {
    return { error: 'Source and destination zones are required.' };
  }
  try {
    const zones = db.getZones();
    const optimalPath = findPath(sourceZone, destinationZone, zones, true);
    if (optimalPath.length === 0) {
      return { error: 'No route could be found between the selected zones.' };
    }
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

export async function classifyAllZonesAction() {
  try {
    rebalanceAllZoneCounts();
    revalidatePath('/user');
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to classify zones.' };
  }
}

export async function updateUserLocationAndClassifyZonesAction(userId, userName, latitude, longitude, groupSize) {
  try {
    const zones = db.getZones();
    const currentUserZone = identifyUserZone(latitude, longitude, zones);
    db.updateUserLocation(userId, userName, latitude, longitude, groupSize, currentUserZone.zoneId);
    rebalanceAllZoneCounts();
    const updatedZones = db.getZones();
    revalidatePath('/user');
    revalidatePath('/admin');
    return { 
      success: true, 
      data: {
        zones: updatedZones,
        currentZone: currentUserZone
      }
    };
  } catch (e) {
    return { error: 'Failed to update location.' };
  }
}

export async function refreshDataAction() {
  revalidatePath('/admin');
  revalidatePath('/user');
}
