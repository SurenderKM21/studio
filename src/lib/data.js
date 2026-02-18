
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'src/lib/db.json');

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const jsonString = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(jsonString);
    }
  } catch (error) {
    console.error('Error reading from DB, returning empty state:', error);
  }
  const defaultData = { zones: [], users: [], settings: {}, alerts: [] };
  writeDb(defaultData);
  return defaultData;
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to DB:', error);
  }
}

export const db = {
  getZones: () => {
    return readDb().zones;
  },
  getZoneById: (id) => {
    const { zones } = readDb();
    return zones.find(z => z.id === id);
  },
  getUserById: (id) => {
    const { users } = readDb();
    return users.find(u => u.id === id);
  },
  getUsers: () => {
    return readDb().users;
  },
  addUser: (user) => {
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
  updateUser: (id, updateData) => {
    const data = readDb();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...updateData };
      writeDb(data);
      return data.users[userIndex];
    }
    return undefined;
  },
  updateUserLocation: (id, name, latitude, longitude, groupSize, zoneId) => {
    const data = readDb();
    const userIndex = data.users.findIndex(u => u.id === id);
    const now = new Date().toISOString();
    const userUpdate = { name, lastLatitude: latitude, lastLongitude: longitude, lastSeen: now, groupSize, lastZoneId: zoneId };

    if (userIndex > -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...userUpdate };
      writeDb(data);
      return data.users[userIndex];
    } else {
      const newUser = { id, name, lastLatitude: latitude, lastLongitude: longitude, lastSeen: now, groupSize, lastZoneId: zoneId, role: 'user', status: 'online' };
      data.users.push(newUser);
      writeDb(data);
      return newUser;
    }
  },
  removeUser: (id) => {
    const data = readDb();
    data.users = data.users.filter(u => u.id !== id);
    writeDb(data);
  },
  clearAllUsers: () => {
    const data = readDb();
    data.users = data.users.filter(u => u.status === 'online' || u.role === 'admin');
    writeDb(data);
  },
  addZone: (zone) => {
    const data = readDb();
    const newZone = {
      ...zone,
      id: `zone-${Math.random().toString(36).substring(2, 9)}`,
      userCount: 0,
      density: 'free',
      notes: [],
    };
    data.zones.push(newZone);
    writeDb(data);
    return newZone;
  },
  updateZone: (id, updatedData) => {
    const data = readDb();
    const zoneIndex = data.zones.findIndex(z => z.id === id);
    if (zoneIndex > -1) {
      data.zones[zoneIndex] = { ...data.zones[zoneIndex], ...updatedData };
      writeDb(data);
      return data.zones[zoneIndex];
    }
    return undefined;
  },
  deleteZone: (id) => {
    const data = readDb();
    data.zones = data.zones.filter(z => z.id !== id);
    writeDb(data);
  },
  addNoteToZone: (zoneId, noteText, visibleToUser) => {
    const data = readDb();
    const zoneIndex = data.zones.findIndex(z => z.id === zoneId);
    if (zoneIndex > -1) {
      if (!data.zones[zoneIndex].notes) {
        data.zones[zoneIndex].notes = [];
      }
      const newNote = {
        id: `note-${Date.now()}`,
        text: noteText,
        visibleToUser,
        createdAt: new Date().toISOString(),
      };
      data.zones[zoneIndex].notes.push(newNote);
      writeDb(data);
    }
  },
  deleteNoteFromZone: (zoneId, noteId) => {
    const data = readDb();
    const zoneIndex = data.zones.findIndex(z => z.id === zoneId);
    if (zoneIndex > -1 && data.zones[zoneIndex].notes) {
      data.zones[zoneIndex].notes = data.zones[zoneIndex].notes.filter(note => note.id !== noteId);
      writeDb(data);
    }
  },
  getSettings: () => {
    const data = readDb();
    return data.settings || { locationUpdateInterval: 30, zoneSnappingThreshold: 15 };
  },
  updateSettings: (newSettings) => {
    const data = readDb();
    data.settings = { ...data.settings, ...newSettings };
    writeDb(data);
    return data.settings;
  },
  addAlert: (message, zoneId) => {
    const data = readDb();
    const timestamp = new Date().toISOString();
    const newAlert = {
      id: `alert-${timestamp}`,
      message,
      timestamp,
      zoneId: zoneId || null,
    };
    data.alerts.push(newAlert);
    data.settings.latestAlertTimestamp = timestamp;
    writeDb(data);
    return newAlert;
  },
  getLatestAlert: () => {
    const { alerts } = readDb();
    if (alerts.length === 0) return undefined;
    return alerts[alerts.length - 1];
  },
};
