
import type { Zone, AppSettings, DensityCategory, User } from './types';
import fs from 'fs';
import path from 'path';

type DbData = {
  zones: Zone[];
  users: User[];
  settings: AppSettings;
};

// Ensure the directory exists before resolving the path
const dbDirectory = path.resolve(process.cwd(), 'src/lib');
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}
const dbPath = path.resolve(dbDirectory, 'db.json');


function readDb(): DbData {
  try {
    if (fs.existsSync(dbPath)) {
      const jsonString = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(jsonString) as DbData;
    }
  } catch (error) {
    console.error('Error reading from DB, returning empty state:', error);
  }
  // If file doesn't exist or is corrupt, return a default structure
  const defaultData = { zones: [], users: [], settings: {} };
  writeDb(defaultData);
  return defaultData;
}

function writeDb(data: DbData): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error)
  {
    console.error('Error writing to DB:', error);
  }
}

export const db = {
  getZones: (): Zone[] => {
    return readDb().zones;
  },
  getZoneById: (id: string): Zone | undefined => {
    const { zones } = readDb();
    return zones.find(z => z.id === id);
  },
  addZone: (zone: Omit<Zone, 'id' | 'userCount' | 'density'>): Zone => {
    const data = readDb();
    const newZone: Zone = {
      ...zone,
      id: `zone-${Math.random().toString(36).substring(2, 9)}`,
      userCount: 0,
      density: 'free',
    };
    data.zones.push(newZone);
    writeDb(data);
    return newZone;
  },
  deleteZone: (id: string): void => {
    const data = readDb();
    data.zones = data.zones.filter(z => z.id !== id);
    writeDb(data);
  },
  updateZone: (id: string, updatedData: Partial<Omit<Zone, 'id'>>): Zone | undefined => {
    const data = readDb();
    const zoneIndex = data.zones.findIndex(z => z.id === id);
    if (zoneIndex > -1) {
      data.zones[zoneIndex] = { ...data.zones[zoneIndex], ...updatedData };
      writeDb(data);
      return data.zones[zoneIndex];
    }
    return undefined;
  },
  getSettings: (): AppSettings => {
    return readDb().settings;
  },
  updateSettings: (newSettings: Partial<AppSettings>): AppSettings => {
    const data = readDb();
    data.settings = { ...data.settings, ...newSettings };
    writeDb(data);
    return data.settings;
  },
  getUsers: (): User[] => {
    return readDb().users;
  },
  addUser: (user: User): User => {
    const data = readDb();
    const userIndex = data.users.findIndex(u => u.id === user.id);
    if (userIndex > -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...user, lastSeen: new Date().toISOString() };
    } else {
      data.users.push(user);
    }
    writeDb(data);
    return user;
  },
  updateUser: (id: string, updateData: Partial<User>): User | undefined => {
    const data = readDb();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...updateData };
      writeDb(data);
      return data.users[userIndex];
    }
    return undefined;
  },
  updateUserLocation: (id: string, name: string, latitude: number, longitude: number, groupSize: number, zoneId?: string): User => {
    const data = readDb();
    const userIndex = data.users.findIndex(u => u.id === id);
    const now = new Date().toISOString();
    const userUpdate: Partial<User> = { name, lastLatitude: latitude, lastLongitude: longitude, lastSeen: now, groupSize, lastZoneId: zoneId };

    if (userIndex > -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...userUpdate };
      writeDb(data);
      return data.users[userIndex];
    } else {
      const newUser: User = { id, name, lastLatitude: latitude, lastLongitude: longitude, lastSeen: now, groupSize, lastZoneId: zoneId };
      data.users.push(newUser);
      writeDb(data);
      return newUser;
    }
  },
  removeUser: (id: string): void => {
    const data = readDb();
    data.users = data.users.filter(u => u.id !== id);
    writeDb(data);
  }
};
