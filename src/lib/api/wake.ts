export interface WakeOptions {
  /** Devuelve true si el servidor respondio bien. No debe lanzar. */
  ping: () => Promise<boolean>;
  maxMs?: number;
  intervalMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  onTick?: (info: { elapsedMs: number; attempt: number }) => void;
}

/** Tiempo maximo de espera: el plan gratis de Render tarda ~50 s en despertar. */
export const WAKE_MAX_MS = 90_000;
export const WAKE_INTERVAL_MS = 3_000;

/** Reintenta el ping hasta que el servidor responda o se agote el tiempo. */
export async function runWake({
  ping,
  maxMs = WAKE_MAX_MS,
  intervalMs = WAKE_INTERVAL_MS,
  now = Date.now,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  onTick,
}: WakeOptions): Promise<boolean> {
  const start = now();
  let attempt = 0;
  for (;;) {
    attempt += 1;
    if (await ping().catch(() => false)) return true;
    const elapsedMs = now() - start;
    if (elapsedMs + intervalMs >= maxMs) return false;
    onTick?.({ elapsedMs, attempt });
    await sleep(intervalMs);
  }
}
