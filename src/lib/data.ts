import type { Zone, AppSettings, DensityCategory, User } from './types';

let zones: Zone[] = [];
let users: User[] = [];

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
  getUsers: (): User[] => users,
  updateUserLocation: (id: string, name: string, latitude: number, longitude: number): User => {
    const userIndex = users.findIndex(u => u.id === id);
    const now = new Date().toISOString();
    if (userIndex > -1) {
      users[userIndex] = { ...users[userIndex], lastLatitude: latitude, lastLongitude: longitude, lastSeen: now };
      return users[userIndex];
    } else {
      const newUser: User = { id, name, lastLatitude: latitude, lastLongitude: longitude, lastSeen: now };
      users.push(newUser);
      return newUser;
    }
  },
};
