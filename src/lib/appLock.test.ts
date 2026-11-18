import { isOpenRoute, lockOverlayVisible, LOCK_GRACE_MS, shouldLockOnResume } from './appLock';

describe('appLock', () => {
  it('las rutas de emergencia quedan abiertas', () => {
    expect(isOpenRoute('/emergency')).toBe(true);
    expect(isOpenRoute('/medical-id')).toBe(true);
    expect(isOpenRoute('/settings')).toBe(false);
    expect(isOpenRoute('/emergency-contacts')).toBe(false);
  });

  it('bloquea solo si está activado y pasó el tiempo de gracia', () => {
    expect(shouldLockOnResume(false, 0, LOCK_GRACE_MS * 10)).toBe(false);
    expect(shouldLockOnResume(true, null, 1000)).toBe(false);
    expect(shouldLockOnResume(true, 1000, 1000 + LOCK_GRACE_MS - 1)).toBe(false);
    expect(shouldLockOnResume(true, 1000, 1000 + LOCK_GRACE_MS)).toBe(true);
  });

  it('la capa se oculta en rutas de emergencia y sin sesión', () => {
    expect(lockOverlayVisible(true, true, '/')).toBe(true);
    expect(lockOverlayVisible(true, true, '/medical-id')).toBe(false);
    expect(lockOverlayVisible(true, false, '/')).toBe(false);
    expect(lockOverlayVisible(false, true, '/')).toBe(false);
  });
});
