import { base64ToBytes } from './encoding';

/** Servicio estandar Heart Rate (Bluetooth SIG) y su caracteristica Heart Rate Measurement. */
export const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';

export interface HeartRateReading {
  /** Pulso en latidos por minuto. */
  heartRate: number;
  /** El sensor soporta deteccion de contacto con la piel. */
  contactSupported: boolean;
  /** Solo es confiable si `contactSupported`; si es false el reloj no esta en la muñeca. */
  contactDetected: boolean;
  /** Energia gastada acumulada en kJ, si el dispositivo la reporta. */
  energyExpendedKj: number | null;
  /** Intervalos RR en milisegundos (1/1024 s en la trama). */
  rrIntervalsMs: number[];
}

const FLAG_HR_UINT16 = 0x01;
const FLAG_CONTACT_DETECTED = 0x02;
const FLAG_CONTACT_SUPPORTED = 0x04;
const FLAG_ENERGY = 0x08;
const FLAG_RR = 0x10;

export class HeartRateParseError extends Error {}

/**
 * Parsea la caracteristica Heart Rate Measurement (0x2A37) segun la
 * especificacion GATT: byte de flags, pulso uint8/uint16 little-endian,
 * energia gastada opcional (uint16) y cero o mas intervalos RR (uint16).
 */
export function parseHeartRateMeasurement(bytes: Uint8Array): HeartRateReading {
  if (bytes.length < 2) throw new HeartRateParseError('Trama demasiado corta');
  const flags = bytes[0] as number;
  let offset = 1;

  let heartRate: number;
  if (flags & FLAG_HR_UINT16) {
    if (bytes.length < offset + 2) throw new HeartRateParseError('Pulso uint16 incompleto');
    heartRate = (bytes[offset] as number) | ((bytes[offset + 1] as number) << 8);
    offset += 2;
  } else {
    heartRate = bytes[offset] as number;
    offset += 1;
  }

  let energyExpendedKj: number | null = null;
  if (flags & FLAG_ENERGY) {
    if (bytes.length < offset + 2) throw new HeartRateParseError('Energia incompleta');
    energyExpendedKj = (bytes[offset] as number) | ((bytes[offset + 1] as number) << 8);
    offset += 2;
  }

  const rrIntervalsMs: number[] = [];
  if (flags & FLAG_RR) {
    while (offset + 1 < bytes.length) {
      const raw = (bytes[offset] as number) | ((bytes[offset + 1] as number) << 8);
      rrIntervalsMs.push(Math.round((raw / 1024) * 1000 * 10) / 10);
      offset += 2;
    }
  }

  return {
    heartRate,
    contactSupported: (flags & FLAG_CONTACT_SUPPORTED) !== 0,
    contactDetected: (flags & FLAG_CONTACT_DETECTED) !== 0,
    energyExpendedKj,
    rrIntervalsMs,
  };
}

/** Atajo para el valor base64 que entrega react-native-ble-plx. */
export function parseHeartRateBase64(value: string): HeartRateReading {
  return parseHeartRateMeasurement(base64ToBytes(value));
}

/** Pulso fisiologicamente plausible (el back rechaza fuera de 20..250). */
export function isPlausibleHeartRate(bpm: number): boolean {
  return Number.isFinite(bpm) && bpm >= 20 && bpm <= 250;
}

/**
 * HRV como RMSSD (ms) sobre intervalos RR consecutivos. Devuelve null si hay
 * menos de dos intervalos, porque no se puede calcular una diferencia.
 */
export function rmssd(rrMs: readonly number[]): number | null {
  if (rrMs.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < rrMs.length; i++) {
    const d = (rrMs[i] as number) - (rrMs[i - 1] as number);
    sum += d * d;
  }
  return Math.round(Math.sqrt(sum / (rrMs.length - 1)) * 10) / 10;
}
