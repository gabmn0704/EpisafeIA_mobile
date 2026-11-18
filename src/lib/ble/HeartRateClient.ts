import { CircularBuffer } from '@/lib/structures';
import { isPlausibleHeartRate, parseHeartRateBase64, rmssd } from './hrParser';
import type { SampleInput } from './SampleUploader';
import type { BleDeviceInfo, BleTransport, Subscription } from './transport';

export type HrStatus = 'idle' | 'unavailable' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface HrState {
  status: HrStatus;
  /** Dispositivos con servicio Heart Rate encontrados durante el escaneo. */
  found: BleDeviceInfo[];
  device: BleDeviceInfo | null;
  lastHeartRate: number | null;
  lastReadingAt: number | null;
  /** false si el reloj reporta que no esta en contacto con la piel. */
  contactDetected: boolean | null;
  reconnectAttempt: number;
  message: string | null;
}

export interface HeartRateClientOptions {
  transport: BleTransport;
  onSample: (sample: SampleInput) => void;
  now?: () => number;
  maxReconnectAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
}

const initial: HrState = {
  status: 'idle',
  found: [],
  device: null,
  lastHeartRate: null,
  lastReadingAt: null,
  contactDetected: null,
  reconnectAttempt: 0,
  message: null,
};

/**
 * Cliente del servicio estandar Heart Rate. Gestiona escaneo, conexion,
 * suscripcion a notificaciones y reconexion con backoff exponencial.
 * No genera datos: si no hay dispositivo, no hay muestras.
 */
export class HeartRateClient {
  private state: HrState = { ...initial };
  private listeners = new Set<(s: HrState) => void>();
  private readonly now: () => number;
  private readonly maxAttempts: number;
  private readonly baseBackoff: number;
  private readonly maxBackoff: number;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private monitorSub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;
  private userDisconnected = false;
  private rr = new CircularBuffer<number>(8);

  constructor(private readonly opts: HeartRateClientOptions) {
    this.now = opts.now ?? Date.now;
    this.maxAttempts = opts.maxReconnectAttempts ?? 8;
    this.baseBackoff = opts.baseBackoffMs ?? 1000;
    this.maxBackoff = opts.maxBackoffMs ?? 30_000;
  }

  getState(): HrState {
    return this.state;
  }

  subscribe(listener: (s: HrState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(patch: Partial<HrState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }

  async startScan(timeoutMs = 15_000): Promise<void> {
    if (this.state.status === 'scanning' || this.state.status === 'connecting') return;
    const power = await this.opts.transport.powerState();
    if (power !== 'on') {
      const msg: Record<string, string> = {
        off: 'El Bluetooth está apagado. Enciéndelo para buscar tu reloj.',
        unauthorized: 'EpiSafe no tiene permiso de Bluetooth. Actívalo en los ajustes del teléfono.',
        unsupported: 'Este dispositivo no soporta Bluetooth de bajo consumo.',
        unknown: 'No se pudo leer el estado del Bluetooth.',
      };
      this.set({ status: 'error', message: msg[power] ?? msg.unknown ?? null });
      return;
    }
    this.set({ status: 'scanning', found: [], message: null });
    this.opts.transport.startScan(
      (d) => {
        if (this.state.found.some((f) => f.id === d.id)) return;
        this.set({ found: [...this.state.found, d] });
      },
      (e) => {
        this.clearScanTimer();
        this.set({ status: 'error', message: `Error al escanear: ${e.message}` });
      },
    );
    this.scanTimer = setTimeout(() => this.stopScan(), timeoutMs);
  }

  stopScan(): void {
    this.clearScanTimer();
    this.opts.transport.stopScan();
    if (this.state.status === 'scanning') this.set({ status: 'idle' });
  }

  private clearScanTimer(): void {
    if (this.scanTimer) clearTimeout(this.scanTimer);
    this.scanTimer = null;
  }

  async connect(device: BleDeviceInfo): Promise<void> {
    this.clearScanTimer();
    this.opts.transport.stopScan();
    this.userDisconnected = false;
    this.clearRetry();
    this.teardownSubscriptions();
    this.set({ status: 'connecting', device, message: null, reconnectAttempt: 0 });
    await this.attempt(device);
  }

  private async attempt(device: BleDeviceInfo): Promise<void> {
    try {
      await this.opts.transport.connect(device.id);
    } catch (e) {
      this.scheduleReconnect(device, e instanceof Error ? e.message : 'No se pudo conectar');
      return;
    }
    if (this.userDisconnected) return;
    this.teardownSubscriptions();
    this.disconnectSub = this.opts.transport.onDisconnected(device.id, () => {
      if (this.userDisconnected) return;
      this.teardownSubscriptions();
      this.scheduleReconnect(device, 'Se perdió la conexión con el reloj');
    });
    this.monitorSub = this.opts.transport.monitorHeartRate(
      device.id,
      (b64) => this.handleValue(b64),
      (e) => {
        if (this.userDisconnected) return;
        this.teardownSubscriptions();
        this.scheduleReconnect(device, e.message);
      },
    );
    this.set({ status: 'connected', reconnectAttempt: 0, message: null });
  }

  private scheduleReconnect(device: BleDeviceInfo, reason: string): void {
    const attempt = this.state.reconnectAttempt + 1;
    if (attempt > this.maxAttempts) {
      this.set({ status: 'error', message: `${reason}. Se agotaron los reintentos.`, reconnectAttempt: attempt });
      return;
    }
    const delay = Math.min(this.baseBackoff * 2 ** (attempt - 1), this.maxBackoff);
    this.set({ status: 'reconnecting', reconnectAttempt: attempt, message: `${reason}. Reintentando en ${Math.round(delay / 1000)} s...` });
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.userDisconnected) void this.attempt(device);
    }, delay);
  }

  private clearRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private teardownSubscriptions(): void {
    this.monitorSub?.remove();
    this.disconnectSub?.remove();
    this.monitorSub = null;
    this.disconnectSub = null;
  }

  private handleValue(base64: string): void {
    let reading;
    try {
      reading = parseHeartRateBase64(base64);
    } catch {
      return; // trama corrupta: se ignora, nunca se inventa un valor
    }
    const onSkin = !reading.contactSupported || reading.contactDetected;
    const at = this.now();
    this.set({
      contactDetected: reading.contactSupported ? reading.contactDetected : null,
      lastReadingAt: at,
      ...(onSkin && isPlausibleHeartRate(reading.heartRate) ? { lastHeartRate: reading.heartRate } : { lastHeartRate: null }),
    });
    if (!onSkin || !isPlausibleHeartRate(reading.heartRate)) return;
    for (const r of reading.rrIntervalsMs) this.rr.push(r);
    const hrv = rmssd(this.rr.toArray());
    this.opts.onSample({
      sampledAt: new Date(at).toISOString(),
      heartRate: reading.heartRate,
      ...(hrv !== null ? { hrvMs: Math.min(hrv, 500) } : {}),
    });
  }

  async disconnect(): Promise<void> {
    this.userDisconnected = true;
    this.clearRetry();
    this.clearScanTimer();
    this.teardownSubscriptions();
    const id = this.state.device?.id;
    if (id) {
      try {
        await this.opts.transport.disconnect(id);
      } catch {
        // ya estaba desconectado
      }
    }
    this.rr.clear();
    this.set({ ...initial, found: this.state.found });
  }

  dispose(): void {
    this.userDisconnected = true;
    this.clearRetry();
    this.clearScanTimer();
    this.teardownSubscriptions();
    this.opts.transport.destroy();
    this.listeners.clear();
  }
}
