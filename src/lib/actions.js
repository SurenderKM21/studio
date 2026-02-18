'use server';

import { revalidatePath } from 'next/cache';
import { db } from './data';
import { redirect } from 'next/navigation';

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
    return { success: true };
  } catch (e) {
    console.error("Add zone error:", e);
    return { error: e.message };
  }
}

export async function deleteZoneAction(zoneId) {
  try {
    await db.deleteZone(zoneId);
    revalidatePath('/admin');
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
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function addZoneNoteAction(zoneId, noteText, visibleToUser) {
  try {
    await db.addNoteToZone(zoneId, noteText, visibleToUser);
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteZoneNoteAction(zoneId, noteId) {
  try {
    await db.deleteNoteFromZone(zoneId, noteId);
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function manualUpdateDensityAction(zoneId, density) {
  try {
    await db.updateZone(zoneId, { density, manualDensity: true });
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateSettingsAction(settings) {
  try {
    await db.updateSettings(settings);
    revalidatePath('/admin');
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

export async function refreshDataAction() {
  revalidatePath('/admin');
  revalidatePath('/user');
}
