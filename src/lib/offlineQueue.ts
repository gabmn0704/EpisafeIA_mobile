import { ApiError } from '@/lib/api/errors';
import type { DailyLogInput, SeizureInput } from '@/lib/api/endpoints';

export type PendingItem =
  | { id: string; kind: 'seizure'; createdAt: string; payload: SeizureInput }
  | { id: string; kind: 'dailyLog'; createdAt: string; payload: DailyLogInput; date: string };

export type NewPendingItem = { kind: 'seizure'; payload: SeizureInput } | { kind: 'dailyLog'; payload: DailyLogInput; date: string };

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface FlushResult {
  sent: number;
  dropped: number;
  remaining: number;
}

export type Sender = (item: PendingItem) => Promise<void>;

/** Solo los fallos de red/timeout o de servidor (5xx) merecen reintento; un 4xx no se arreglará solo. */
export function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) return error.isNetwork || error.status >= 500 || error.status === 401 || error.status === 429;
  return true;
}

/** Cola persistente (FIFO) de registros creados sin conexión. */
export class OfflineQueue {
  private items: PendingItem[] = [];
  private loaded = false;
  private flushing: Promise<FlushResult> | null = null;
  private readonly listeners = new Set<(count: number) => void>();

  constructor(
    private readonly key: string,
    private readonly store: KeyValueStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async load(): Promise<number> {
    if (!this.loaded) {
      try {
        const raw = await this.store.getItem(this.key);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        this.items = Array.isArray(parsed) ? (parsed as PendingItem[]) : [];
      } catch {
        this.items = [];
      }
      this.loaded = true;
      this.emit();
    }
    return this.items.length;
  }

  get count(): number {
    return this.items.length;
  }

  list(): readonly PendingItem[] {
    return this.items;
  }

  subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async enqueue(item: NewPendingItem): Promise<PendingItem> {
    await this.load();
    const createdAt = this.now().toISOString();
    const full = { ...item, id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`, createdAt } as PendingItem;
    // Un registro diario pendiente de la misma fecha se reemplaza: solo importa el último.
    this.items = this.items.filter((i) => !(full.kind === 'dailyLog' && i.kind === 'dailyLog' && i.date === full.date));
    this.items.push(full);
    await this.persist();
    return full;
  }

  /** Intenta enviar todo en orden. Se detiene ante el primer fallo reintentable. */
  flush(send: Sender): Promise<FlushResult> {
    if (this.flushing) return this.flushing;
    this.flushing = this.doFlush(send).finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async doFlush(send: Sender): Promise<FlushResult> {
    await this.load();
    let sent = 0;
    let dropped = 0;
    while (this.items.length > 0) {
      const head = this.items[0] as PendingItem;
      try {
        await send(head);
        sent += 1;
      } catch (e) {
        if (isRetryable(e)) break;
        dropped += 1;
      }
      this.items = this.items.filter((i) => i.id !== head.id);
      await this.persist();
    }
    return { sent, dropped, remaining: this.items.length };
  }

  private async persist(): Promise<void> {
    try {
      await this.store.setItem(this.key, JSON.stringify(this.items));
    } catch {
      // si no se puede persistir, la cola sigue en memoria durante la sesión
    }
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l(this.items.length));
  }
}
