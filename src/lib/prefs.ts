import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseProfile, parseSnapshot, type MedicalProfile, type MedicalSnapshot } from './medicalId';

const ONBOARDED = 'episafe.onboarded.v1';
const REMINDERS = 'episafe.reminders.v1';
const APP_LOCK = 'episafe.appLock.v1';
const MEDICAL_PROFILE = 'episafe.medicalProfile.v1';
const MEDICAL_SNAPSHOT = 'episafe.medicalSnapshot.v1';

async function read(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // preferencia no crítica
  }
}

export const prefs = {
  hasOnboarded: async () => (await read(ONBOARDED)) === '1',
  setOnboarded: () => write(ONBOARDED, '1'),
  remindersEnabled: async () => (await read(REMINDERS)) !== '0',
  setRemindersEnabled: (on: boolean) => write(REMINDERS, on ? '1' : '0'),
  appLockEnabled: async () => (await read(APP_LOCK)) === '1',
  setAppLockEnabled: (on: boolean) => write(APP_LOCK, on ? '1' : '0'),
  getMedicalProfile: async (): Promise<MedicalProfile> => parseProfile(await read(MEDICAL_PROFILE)),
  setMedicalProfile: (p: MedicalProfile) => write(MEDICAL_PROFILE, JSON.stringify(p)),
  getMedicalSnapshot: async (): Promise<MedicalSnapshot | null> => parseSnapshot(await read(MEDICAL_SNAPSHOT)),
  setMedicalSnapshot: (s: MedicalSnapshot) => write(MEDICAL_SNAPSHOT, JSON.stringify(s)),
};
