import { CircularBuffer } from '@/lib/structures';

/** Forma que acepta POST /wearables/samples. */
export interface SampleInput {
  sampledAt: string;
  heartRate?: number;
  hrvMs?: number;
  spo2?: number;
  motionIntensity?: number;
  skinTempC?: number;
  steps?: number;
}

/** El API acepta como maximo 200 muestras por lote. */
export const MAX_BATCH = 200;

export interface SampleUploaderOptions {
  send: (samples: SampleInput[]) => Promise<void>;
  /** Capacidad del buffer circular: si el celular no tiene red, se descarta lo mas viejo. */
  capacity?: number;
  batchSize?: number;
  /** Periodo del envio automatico mientras este iniciado. */
  intervalMs?: number;
}

export interface FlushResult {
  sent: number;
  batches: number;
  failed: boolean;
}

/**
 * Acumula muestras en un buffer circular y las envia por lotes. Si un envio
 * falla las muestras se conservan (no se quitan del buffer) y se reintenta
 * en el siguiente ciclo; solo se pierden si el buffer se desborda.
 */
export class SampleUploader {
  private readonly buffer: CircularBuffer<SampleInput>;
  private readonly batchSize: number;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing: Promise<FlushResult> | null = null;
  private droppedCount = 0;

  constructor(private readonly opts: SampleUploaderOptions) {
    this.buffer = new CircularBuffer<SampleInput>(opts.capacity ?? 5000);
    this.batchSize = Math.min(Math.max(1, opts.batchSize ?? MAX_BATCH), MAX_BATCH);
    this.intervalMs = opts.intervalMs ?? 15_000;
  }

  get pending(): number {
    return this.buffer.size;
  }

  /** Muestras descartadas por desborde del buffer. */
  get dropped(): number {
    return this.droppedCount;
  }

  add(sample: SampleInput): void {
    if (this.buffer.push(sample) !== undefined) this.droppedCount++;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Vacia el buffer en lotes. Llamadas concurrentes comparten el mismo envio. */
  flush(): Promise<FlushResult> {
    if (this.flushing) return this.flushing;
    this.flushing = this.run().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async run(): Promise<FlushResult> {
    let sent = 0;
    let batches = 0;
    while (this.buffer.size > 0) {
      const batch = this.buffer.peek(this.batchSize);
      try {
        await this.opts.send(batch);
      } catch {
        return { sent, batches, failed: true };
      }
      // Pudieron llegar muestras nuevas (y evictar viejas) durante el await.
      this.buffer.drain(Math.min(batch.length, this.buffer.size));
      sent += batch.length;
      batches++;
    }
    return { sent, batches, failed: false };
  }
}
