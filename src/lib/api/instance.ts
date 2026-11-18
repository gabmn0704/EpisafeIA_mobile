import { API_URL } from '@/lib/config';
import { ApiClient } from './client';
import { createEndpoints } from './endpoints';
import { clearTokens, loadTokens, saveTokens, type Tokens } from './tokenStore';

let current: Tokens | null = null;
const listeners = new Set<(t: Tokens | null) => void>();

/** Sesion en memoria respaldada por SecureStore. Un unico punto de verdad para los tokens. */
export const session = {
  get: (): Tokens | null => current,
  async restore(): Promise<Tokens | null> {
    current = await loadTokens();
    return current;
  },
  async set(tokens: Tokens | null): Promise<void> {
    current = tokens;
    if (tokens) await saveTokens(tokens);
    else await clearTokens();
    listeners.forEach((l) => l(tokens));
  },
  subscribe(listener: (t: Tokens | null) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const api = new ApiClient({
  baseUrl: API_URL,
  getTokens: session.get,
  setTokens: session.set,
});

export const endpoints = createEndpoints(api);
