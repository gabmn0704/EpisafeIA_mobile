import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDED = 'episafe.onboarded.v1';
const REMINDERS = 'episafe.reminders.v1';

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
};
