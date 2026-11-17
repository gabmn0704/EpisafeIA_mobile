import * as Location from 'expo-location';

export type PositionResult =
  | { ok: true; latitude: number; longitude: number; accuracy: number | null }
  | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' };

/**
 * Obtiene la ubicación para la emergencia: permiso, posición reciente (rápida)
 * y, si no hay, una lectura nueva con tiempo máximo. Nunca bloquea el aviso.
 */
export async function getEmergencyPosition(timeoutMs = 7000): Promise<PositionResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };

    const last = await Location.getLastKnownPositionAsync({ maxAge: 120_000, requiredAccuracy: 200 }).catch(() => null);
    if (last) return { ok: true, latitude: last.coords.latitude, longitude: last.coords.longitude, accuracy: last.coords.accuracy };

    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!fresh) return { ok: false, reason: 'timeout' };
    return { ok: true, latitude: fresh.coords.latitude, longitude: fresh.coords.longitude, accuracy: fresh.coords.accuracy };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
