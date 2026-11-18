import type { ZodType } from 'zod';
import { ApiError, isApiErrorBody } from './errors';
import type { Tokens } from './tokenStore';

export interface ApiClientDeps {
  baseUrl: string;
  getTokens: () => Tokens | null;
  /** Llamado cuando el refresh produce tokens nuevos (o null si la sesión murió). */
  setTokens: (tokens: Tokens | null) => void | Promise<void>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface RequestOptions<T> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  schema?: ZodType<T>;
  /** false para endpoints publicos (login, registro, health). */
  auth?: boolean;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export function buildQuery(query?: RequestOptions<unknown>['query']): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export class ApiClient {
  private refreshing: Promise<boolean> | null = null;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly deps: ApiClientDeps) {
    this.doFetch = deps.fetchImpl ?? ((...args) => fetch(...args));
    this.timeoutMs = deps.timeoutMs ?? 30_000;
  }

  get<T = unknown>(path: string, opts?: RequestOptions<T>): Promise<T> {
    return this.request<T>('GET', path, opts);
  }
  post<T = unknown>(path: string, opts?: RequestOptions<T>): Promise<T> {
    return this.request<T>('POST', path, opts);
  }
  put<T = unknown>(path: string, opts?: RequestOptions<T>): Promise<T> {
    return this.request<T>('PUT', path, opts);
  }
  delete<T = unknown>(path: string, opts?: RequestOptions<T>): Promise<T> {
    return this.request<T>('DELETE', path, opts);
  }

  async request<T>(method: Method, path: string, opts: RequestOptions<T> = {}): Promise<T> {
    const auth = opts.auth ?? true;
    let res = await this.send(method, path, opts, auth);
    if (res.status === 401 && auth && this.deps.getTokens()) {
      if (await this.refreshOnce()) res = await this.send(method, path, opts, auth);
    }
    return this.parse<T>(res, opts.schema);
  }

  private async send(method: Method, path: string, opts: RequestOptions<unknown>, auth: boolean): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const tokens = this.deps.getTokens();
    if (auth && tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.doFetch(`${this.deps.baseUrl}${path}${buildQuery(opts.query)}`, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw new ApiError(0, 'TIMEOUT', 'El servidor tardó demasiado en responder.');
      throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
    } finally {
      clearTimeout(timer);
    }
  }

  /** Una sola renovación en vuelo, aunque fallen varias peticiones a la vez. */
  private refreshOnce(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = this.refresh().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  private async refresh(): Promise<boolean> {
    const current = this.deps.getTokens();
    if (!current) return false;
    try {
      const res = await this.send('POST', '/auth/refresh', { body: { refreshToken: current.refreshToken } }, false);
      if (!res.ok) throw new Error('refresh rechazado');
      const data = (await res.json()) as Partial<Tokens>;
      if (!data.accessToken || !data.refreshToken) throw new Error('respuesta de refresh inválida');
      await this.deps.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch (e) {
      // Un fallo de red no debe cerrar la sesion; solo un rechazo del servidor.
      if (e instanceof ApiError && e.isNetwork) return false;
      await this.deps.setTokens(null);
      return false;
    }
  }

  private async parse<T>(res: Response, schema?: ZodType<T>): Promise<T> {
    if (res.status === 204) return undefined as T;
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      if (isApiErrorBody(body)) {
        throw new ApiError(res.status, body.error.code ?? 'INTERNAL_ERROR', body.error.message ?? 'Error del servidor', body.error.details);
      }
      throw new ApiError(res.status, 'INTERNAL_ERROR', `Error ${res.status} del servidor`);
    }
    if (!schema) return body as T;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(res.status, 'INVALID_RESPONSE', 'El servidor respondió con un formato inesperado.', parsed.error.issues);
    }
    return parsed.data;
  }
}
