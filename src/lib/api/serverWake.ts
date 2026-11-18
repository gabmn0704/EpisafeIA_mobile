import { API_URL } from '@/lib/config';
import { runWake } from './wake';

export type WakePhase = 'idle' | 'checking' | 'waking' | 'ready' | 'failed';
export interface WakeState {
  phase: WakePhase;
  startedAt: number;
}

const FRESH_MS = 8 * 60_000; // Render duerme tras ~15 min sin trafico.
const SHOW_AFTER_MS = 2_000; // No mostrar nada si el servidor responde rapido.

let state: WakeState = { phase: 'idle', startedAt: 0 };
let lastOk = 0;
let inflight: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

const set = (next: WakeState) => {
  state = next;
  listeners.forEach((l) => l());
};

async function ping(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Comprueba el servidor y, si esta dormido, espera con reintentos. Comparte una sola ejecucion. */
export function ensureServerAwake(force = false): Promise<boolean> {
  if (!force && Date.now() - lastOk < FRESH_MS) return Promise.resolve(true);
  if (inflight) return inflight;
  const startedAt = Date.now();
  set({ phase: 'checking', startedAt });
  const reveal = setTimeout(() => {
    if (state.phase === 'checking') set({ phase: 'waking', startedAt });
  }, SHOW_AFTER_MS);
  inflight = runWake({ ping, onTick: () => state.phase === 'checking' && set({ phase: 'waking', startedAt }) })
    .then((ok) => {
      if (ok) lastOk = Date.now();
      set({ phase: ok ? 'ready' : 'failed', startedAt });
      return ok;
    })
    .finally(() => {
      clearTimeout(reveal);
      inflight = null;
    });
  return inflight;
}

export const serverWake = {
  get: (): WakeState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
