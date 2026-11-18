export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetwork(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }
}

/** Mensaje en espanol apto para mostrar al usuario. */
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return 'No se pudo conectar con el servidor. Revisa tu red y la dirección del API.';
    if (error.code === 'TIMEOUT') return 'El servidor tardó demasiado en responder.';
    if (error.code === 'RATE_LIMITED') return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
    if (error.code === 'UNAUTHORIZED') return error.message || 'Tu sesión expiró. Inicia sesión otra vez.';
    return error.message || 'Ocurrió un error inesperado.';
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export function isApiErrorBody(body: unknown): body is { error: { code?: string; message?: string; details?: unknown } } {
  return typeof body === 'object' && body !== null && 'error' in body && typeof (body as { error: unknown }).error === 'object';
}
