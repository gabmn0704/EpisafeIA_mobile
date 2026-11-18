/** Segundos en segundo plano antes de volver a pedir el desbloqueo. */
export const LOCK_GRACE_MS = 30_000;

/** Rutas que siguen abiertas con la app bloqueada, para que un tercero pueda ayudar en una emergencia. */
export const OPEN_ROUTES = ['/emergency', '/medical-id'] as const;

export function isOpenRoute(pathname: string): boolean {
  return OPEN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** Decide si al volver a primer plano hay que bloquear. */
export function shouldLockOnResume(enabled: boolean, backgroundedAt: number | null, now: number, graceMs: number = LOCK_GRACE_MS): boolean {
  if (!enabled || backgroundedAt === null) return false;
  return now - backgroundedAt >= graceMs;
}

/** La capa de bloqueo cubre la app salvo en las rutas de emergencia. */
export function lockOverlayVisible(locked: boolean, signedIn: boolean, pathname: string): boolean {
  return locked && signedIn && !isOpenRoute(pathname);
}
