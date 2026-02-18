import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const { firestore } = initializeFirebase();

export const db = {
  getZones: async () => {
    try {
      const snapshot = await getDocs(collection(firestore, 'zones'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('Error fetching zones:', e);
      return [];
    }
  },

  getZoneById: async (id) => {
    const docRef = doc(firestore, 'zones', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  getUserById: async (id) => {
    const docRef = doc(firestore, 'users', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  getUsers: async () => {
    try {
      const snapshot = await getDocs(collection(firestore, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error('Error fetching users:', e);
      return [];
    }
  },

  addUser: async (user) => {
    const docRef = doc(firestore, 'users', user.id);
    await setDoc(docRef, { 
      ...user, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
    return user;
  },

  updateUser: async (id, data) => {
    const docRef = doc(firestore, 'users', id);
    await updateDoc(docRef, { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
  },

  updateUserLocation: async (id, name, latitude, longitude, groupSize, zoneId) => {
    const docRef = doc(firestore, 'users', id);
    const data = {
      name,
      lastLatitude: latitude,
      lastLongitude: longitude,
      lastSeen: new Date().toISOString(),
      groupSize,
      lastZoneId: zoneId || 'unknown',
      status: 'online',
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, data, { merge: true });
  },

  removeUser: async (id) => {
    await deleteDoc(doc(firestore, 'users', id));
  },

  clearAllUsers: async () => {
    const snapshot = await getDocs(collection(firestore, 'users'));
    const promises = snapshot.docs
      .filter(doc => doc.data().status !== 'online' && doc.data().role !== 'admin')
      .map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
  },

  addZone: async (zone) => {
    const id = zone.id || `zone-${Math.random().toString(36).substring(2, 9)}`;
    const docRef = doc(firestore, 'zones', id);
    await setDoc(docRef, {
      ...zone,
      userCount: zone.userCount || 0,
      density: zone.density || 'free',
      notes: zone.notes || [],
      updatedAt: serverTimestamp()
    });
  },

  updateZone: async (id, data) => {
    const docRef = doc(firestore, 'zones', id);
    await updateDoc(docRef, { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
  },

  deleteZone: async (id) => {
    await deleteDoc(doc(firestore, 'zones', id));
  },

  addNoteToZone: async (zoneId, noteText, visibleToUser) => {
    const docRef = doc(firestore, 'zones', zoneId);
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteText,
      visibleToUser,
      createdAt: new Date().toISOString()
    };
    await updateDoc(docRef, {
      notes: arrayUnion(newNote),
      updatedAt: serverTimestamp()
    });
  },

  deleteNoteFromZone: async (zoneId, noteId) => {
    const docRef = doc(firestore, 'zones', zoneId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const notes = snap.data().notes || [];
      const noteToRemove = notes.find(n => n.id === noteId);
      if (noteToRemove) {
        await updateDoc(docRef, {
          notes: arrayRemove(noteToRemove),
          updatedAt: serverTimestamp()
        });
      }
    }
  },

  getSettings: async () => {
    const docRef = doc(firestore, 'settings', 'app');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : { locationUpdateInterval: 30, zoneSnappingThreshold: 15 };
  },

  updateSettings: async (settings) => {
    const docRef = doc(firestore, 'settings', 'app');
    await setDoc(docRef, { 
      ...settings, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
  },

  addAlert: async (message, zoneId = null) => {
    const id = `alert-${Date.now()}`;
    const docRef = doc(firestore, 'alerts', id);
    const alertData = {
      id,
      message,
      zoneId: zoneId || null,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    await setDoc(docRef, alertData);
    
    // Update latest alert timestamp in settings
    const settingsRef = doc(firestore, 'settings', 'app');
    await setDoc(settingsRef, { 
      latestAlertTimestamp: alertData.timestamp 
    }, { merge: true });
    
    return alertData;
  },

  getLatestAlert: async () => {
    const q = query(collection(firestore, 'alerts'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
};
