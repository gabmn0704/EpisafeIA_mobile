import Constants from 'expo-constants';

const DEFAULT_PORT = 4000;
const API_PATH = '/api/v1';

/**
 * Resuelve la URL base del API.
 * 1. `EXPO_PUBLIC_API_URL` si esta definida (recomendado).
 * 2. En desarrollo con Expo Go, usa la IP de la PC que sirve el bundle
 *    (`hostUri`), asumiendo el API en el puerto 4000 de esa misma maquina.
 * 3. `http://localhost:4000/api/v1` (solo sirve en web o emulador iOS).
 */
export function resolveApiUrl(envUrl: string | undefined, hostUri: string | undefined | null): string {
  const explicit = envUrl?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const host = hostUri?.split(':')[0]?.trim();
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${DEFAULT_PORT}${API_PATH}`;
  return `http://localhost:${DEFAULT_PORT}${API_PATH}`;
}

export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri);

/** Expo Go no incluye modulos nativos propios como react-native-ble-plx. */
export const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
