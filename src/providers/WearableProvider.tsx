import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { createBlxTransport } from '@/lib/ble/BlxTransport';
import { HeartRateClient, type HrState } from '@/lib/ble/HeartRateClient';
import { SampleUploader, type SampleInput } from '@/lib/ble/SampleUploader';
import type { BleDeviceInfo } from '@/lib/ble/transport';
import { endpoints } from '@/lib/api/instance';
import { IS_EXPO_GO } from '@/lib/config';
import { CircularBuffer } from '@/lib/structures';

export type WearableAvailability =
  | { available: true }
  | { available: false; reason: 'web' | 'expo-go' | 'native-missing'; message: string };

export interface WearableContextValue {
  availability: WearableAvailability;
  state: HrState;
  /** Últimos pulsos reales recibidos (buffer circular). Vacío si no hay dispositivo. */
  live: number[];
  pendingSamples: number;
  droppedSamples: number;
  lastUploadAt: number | null;
  uploadError: string | null;
  scan: () => Promise<void>;
  stopScan: () => void;
  connect: (device: BleDeviceInfo) => Promise<void>;
  disconnect: () => Promise<void>;
}

const IDLE: HrState = {
  status: 'idle',
  found: [],
  device: null,
  lastHeartRate: null,
  lastReadingAt: null,
  contactDetected: null,
  reconnectAttempt: 0,
  message: null,
};

const Ctx = createContext<WearableContextValue | null>(null);

function detectAvailability(hasTransport: boolean): WearableAvailability {
  if (Platform.OS === 'web') {
    return { available: false, reason: 'web', message: 'El Bluetooth del reloj no está disponible en el navegador. Usa la app en el teléfono.' };
  }
  if (IS_EXPO_GO) {
    return {
      available: false,
      reason: 'expo-go',
      message: 'Expo Go no incluye el módulo Bluetooth. Para conectar un reloj instala el development build (ver README: eas build --profile development).',
    };
  }
  if (!hasTransport) {
    return { available: false, reason: 'native-missing', message: 'Este build no incluye el módulo Bluetooth nativo. Genera un development build.' };
  }
  return { available: true };
}

const LIVE_CAPACITY = 90;

/** Dispositivo activo en el servidor; lo lee el envío por lotes (fuera del ciclo de render). */
const activeDevice: { id: string | undefined } = { id: undefined };

export function WearableProvider({ children }: { children: ReactNode }) {
  const [env] = useState(() => {
    const transport = Platform.OS === 'web' || IS_EXPO_GO ? null : createBlxTransport();
    return { transport, availability: detectAvailability(transport !== null) };
  });
  const [state, setState] = useState<HrState>(IDLE);
  const [live, setLive] = useState<number[]>([]);
  const [meta, setMeta] = useState({ pending: 0, dropped: 0, lastUploadAt: null as number | null, uploadError: null as string | null });

  const [liveBuffer] = useState(() => new CircularBuffer<number>(LIVE_CAPACITY));
  const [uploader] = useState(
    () =>
      new SampleUploader({
        send: async (samples) => {
          await endpoints.wearables.sendSamples(samples, activeDevice.id);
        },
      }),
  );

  const [client] = useState(() =>
    env.transport
      ? new HeartRateClient({
          transport: env.transport,
          onSample: (s: SampleInput) => {
            uploader.add(s);
            if (s.heartRate !== undefined) liveBuffer.push(s.heartRate);
            setLive(liveBuffer.toArray());
          },
        })
      : null,
  );

  useEffect(() => {
    if (!client) return;
    const off = client.subscribe(setState);
    return () => {
      off();
      client.dispose();
    };
  }, [client]);

  // Envío por lotes mientras haya conexión; refresca contadores para la UI.
  useEffect(() => {
    if (state.status !== 'connected') return;
    uploader.start();
    const tick = setInterval(() => setMeta((m) => ({ ...m, pending: uploader.pending, dropped: uploader.dropped })), 2000);
    const flushLoop = setInterval(async () => {
      const r = await uploader.flush();
      setMeta({
        pending: uploader.pending,
        dropped: uploader.dropped,
        lastUploadAt: r.sent > 0 ? Date.now() : null,
        uploadError: r.failed ? 'No se pudieron enviar las muestras; se reintentará.' : null,
      });
    }, 15_000);
    return () => {
      uploader.stop();
      clearInterval(tick);
      clearInterval(flushLoop);
    };
  }, [state.status, uploader]);

  const connect = useCallback(
    async (device: BleDeviceInfo) => {
      if (!client) return;
      try {
        const { device: registered } = await endpoints.wearables.registerDevice({ provider: 'web_bluetooth', deviceName: device.name ?? 'Reloj BLE', externalId: device.id });
        activeDevice.id = registered.id;
      } catch {
        // Sin registro igual se puede medir; las muestras se envían sin deviceId.
        activeDevice.id = undefined;
      }
      await client.connect(device);
    },
    [client],
  );

  const disconnect = useCallback(async () => {
    if (!client) return;
    await client.disconnect();
    await uploader.flush();
    liveBuffer.clear();
    setLive([]);
    setMeta((m) => ({ ...m, pending: uploader.pending, dropped: uploader.dropped }));
  }, [client, uploader, liveBuffer]);

  const value = useMemo<WearableContextValue>(
    () => ({
      availability: env.availability,
      state,
      live,
      pendingSamples: meta.pending,
      droppedSamples: meta.dropped,
      lastUploadAt: meta.lastUploadAt,
      uploadError: meta.uploadError,
      scan: async () => client?.startScan(),
      stopScan: () => client?.stopScan(),
      connect,
      disconnect,
    }),
    [env.availability, state, live, meta, client, connect, disconnect],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWearable(): WearableContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWearable debe usarse dentro de WearableProvider');
  return ctx;
}
