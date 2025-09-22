import type { Zone, AppSettings, DensityCategory } from './types';

let zones: Zone[] = [
  {
    id: 'zone-a',
    name: 'Main Stage',
    coordinates: [{ lat: 34.0522, lng: -118.2437 }],
    capacity: 200,
    userCount: 150,
    density: 'crowded',
  },
  {
    id: 'zone-b',
    name: 'Food Court',
    coordinates: [{ lat: 34.0532, lng: -118.2447 }],
    capacity: 100,
    userCount: 90,
    density: 'over-crowded',
  },
  {
    id: 'zone-c',
    name: 'Merch Tent',
    coordinates: [{ lat: 34.0542, lng: -118.2427 }],
    capacity: 50,
    userCount: 20,
    density: 'moderate',
  },
  {
    id: 'zone-d',
    name: 'Rest Area',
    coordinates: [{ lat: 34.0512, lng: -118.2457 }],
    capacity: 80,
    userCount: 15,
    density: 'free',
  },
  {
    id: 'zone-e',
    name: 'North Entrance',
    coordinates: [{ lat: 34.0552, lng: -118.2437 }],
    capacity: 150,
    userCount: 45,
    density: 'moderate',
  },
];

let settings: AppSettings = {
  updateInterval: 60, // in seconds
};

// Simulate a database
export const db = {
  getZones: (): Zone[] => zones,
  getZoneById: (id: string): Zone | undefined => zones.find(z => z.id === id),
  addZone: (zone: Omit<Zone, 'id' | 'userCount' | 'density'>): Zone => {
    const newZone: Zone = {
      ...zone,
      id: `zone-${Math.random().toString(36).substring(2, 9)}`,
      userCount: 0,
      density: 'free',
    };
    zones.push(newZone);
    return newZone;
  },
  updateZone: (id: string, updatedData: Partial<Zone>): Zone | undefined => {
    const zoneIndex = zones.findIndex(z => z.id === id);
    if (zoneIndex > -1) {
      zones[zoneIndex] = { ...zones[zoneIndex], ...updatedData };
      return zones[zoneIndex];
    }
    return undefined;
  },
  updateZoneDensity: (id: string, density: DensityCategory) => {
    const zone = db.getZoneById(id);
    if (zone) {
      zone.density = density;
    }
  },
  getSettings: (): AppSettings => settings,
  updateSettings: (newSettings: Partial<AppSettings>): AppSettings => {
    settings = { ...settings, ...newSettings };
    return settings;
  },
};
