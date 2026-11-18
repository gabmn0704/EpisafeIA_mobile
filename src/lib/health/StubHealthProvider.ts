import { Platform } from 'react-native';
import type { HealthAvailability, HealthHeartRateSample, HealthPlatform, HealthProvider } from './HealthProvider';

/**
 * PENDIENTE DE IMPLEMENTAR.
 *
 * Marcador de posicion para Apple HealthKit / Android Health Connect.
 * No lee nada del sistema ni genera datos: siempre reporta que no esta
 * disponible y devuelve listas vacias. Ver README, seccion "Reloj y salud".
 *
 * Para implementarlo: crear `HealthKitProvider` (p. ej. con react-native-health)
 * y `HealthConnectProvider` (react-native-health-connect), ambos con
 * development build, y registrarlos en `getHealthProvider`.
 */
export class StubHealthProvider implements HealthProvider {
  readonly implemented = false;
  readonly platform: HealthPlatform;

  constructor(platform?: HealthPlatform) {
    this.platform = platform ?? (Platform.OS === 'ios' ? 'apple_health' : 'google_health');
  }

  async isAvailable(): Promise<HealthAvailability> {
    return { available: false, reason: 'pending_implementation' };
  }

  async requestPermissions(): Promise<boolean> {
    return false;
  }

  async readHeartRate(): Promise<HealthHeartRateSample[]> {
    return [];
  }
}

export function getHealthProvider(): HealthProvider {
  return new StubHealthProvider();
}
