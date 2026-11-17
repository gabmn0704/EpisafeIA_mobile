/**
 * Capa de salud nativa del sistema (Apple HealthKit en iOS, Health Connect en
 * Android). La app habla solo con esta interfaz; cada plataforma tendra su
 * implementacion. Hoy solo existe `StubHealthProvider`, marcado como PENDIENTE.
 */
export type HealthPlatform = 'apple_health' | 'google_health';

export interface HealthHeartRateSample {
  /** ISO-8601. */
  sampledAt: string;
  bpm: number;
}

export type HealthAvailability =
  | { available: true }
  | { available: false; reason: 'pending_implementation' | 'unsupported_platform' | 'not_installed' };

export interface HealthProvider {
  readonly platform: HealthPlatform;
  /** true solo si la implementacion es real y funcional. */
  readonly implemented: boolean;
  isAvailable(): Promise<HealthAvailability>;
  requestPermissions(): Promise<boolean>;
  /** Lecturas reales de pulso entre dos instantes. Nunca devuelve datos inventados. */
  readHeartRate(from: Date, to: Date): Promise<HealthHeartRateSample[]>;
}
