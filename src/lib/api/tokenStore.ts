import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const KEY = 'episafe.tokens.v1';

/** En web no existe Keychain/Keystore: se usa localStorage (solo para desarrollo en navegador). */
const webStorage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export async function loadTokens(): Promise<Tokens | null> {
  try {
    const raw = Platform.OS === 'web' ? webStorage()?.getItem(KEY) ?? null : await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Tokens>;
    return parsed.accessToken && parsed.refreshToken ? { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken } : null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  const raw = JSON.stringify(tokens);
  if (Platform.OS === 'web') webStorage()?.setItem(KEY, raw);
  else await SecureStore.setItemAsync(KEY, raw);
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') webStorage()?.removeItem(KEY);
  else await SecureStore.deleteItemAsync(KEY);
}
