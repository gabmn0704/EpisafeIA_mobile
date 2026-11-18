import * as LocalAuthentication from 'expo-local-authentication';
import { router, usePathname } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { lockOverlayVisible, shouldLockOnResume } from '@/lib/appLock';
import { prefs } from '@/lib/prefs';
import { colors, space } from '@/theme/tokens';
import { useAuth } from './AuthProvider';

export type EnableResult = 'ok' | 'unavailable' | 'failed';

interface AppLockValue {
  enabled: boolean;
  /** Activa o desactiva el bloqueo. Al activar se comprueba que el teléfono tenga huella, rostro o PIN. */
  setEnabled: (on: boolean) => Promise<EnableResult>;
}

const AppLockContext = createContext<AppLockValue>({ enabled: false, setEnabled: async () => 'unavailable' });

const supported = Platform.OS !== 'web';

async function authenticate(): Promise<boolean> {
  try {
    // Con el fallback activo, si no hay biometría el sistema pide el PIN o patrón del teléfono.
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquea EpiSafe', cancelLabel: 'Cancelar' });
    return r.success;
  } catch {
    return false;
  }
}

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const enabledRef = useRef(false);

  // Al abrir la app, si el bloqueo está activo, empieza bloqueada.
  useEffect(() => {
    if (!supported) return;
    void prefs.appLockEnabled().then((on) => {
      enabledRef.current = on;
      setEnabledState(on);
      setLocked(on);
    });
  }, []);

  useEffect(() => {
    if (!supported) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') backgroundedAt.current = Date.now();
      else if (s === 'active') {
        if (shouldLockOnResume(enabledRef.current, backgroundedAt.current, Date.now())) setLocked(true);
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  const setEnabled = useCallback(async (on: boolean): Promise<EnableResult> => {
    if (on) {
      try {
        const [hw, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
        const level = await LocalAuthentication.getEnrolledLevelAsync();
        if (!supported || (!enrolled && level === LocalAuthentication.SecurityLevel.NONE) || (!hw && level === LocalAuthentication.SecurityLevel.NONE)) return 'unavailable';
      } catch {
        return 'unavailable';
      }
      if (!(await authenticate())) return 'failed';
    }
    await prefs.setAppLockEnabled(on);
    enabledRef.current = on;
    setEnabledState(on);
    if (!on) setLocked(false);
    return 'ok';
  }, []);

  const unlockApp = useCallback(() => setLocked(false), []);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);
  return (
    <AppLockContext.Provider value={value}>
      {children}
      <LockOverlay locked={locked} signedIn={status === 'signedIn'} onUnlock={unlockApp} />
    </AppLockContext.Provider>
  );
}

export const useAppLock = () => useContext(AppLockContext);

function LockOverlay({ locked, signedIn, onUnlock }: { locked: boolean; signedIn: boolean; onUnlock: () => void }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const visible = lockOverlayVisible(locked, signedIn, pathname);

  const unlock = useCallback(async () => {
    setBusy(true);
    const ok = await authenticate();
    setBusy(false);
    if (ok) onUnlock();
  }, [onUnlock]);

  // Pide el desbloqueo apenas aparece la capa.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    void authenticate().then((ok) => ok && alive && onUnlock());
    return () => {
      alive = false;
    };
  }, [visible, onUnlock]);

  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Screen scroll={false} glow={colors.brand}>
        <View style={styles.center}>
          <Logo size={44} />
          <Text variant="h1" center style={{ marginTop: space.xl }}>
            EpiSafe está bloqueada
          </Text>
          <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm }}>
            Tus datos de salud están protegidos.
          </Text>
        </View>
        <View style={{ gap: space.md }}>
          <Button label="Desbloquear" icon="shield" size="lg" loading={busy} onPress={() => void unlock()} />
          <Text variant="label" color={colors.muted} center style={{ marginTop: space.md }}>
            ¿Es una emergencia? No necesitas desbloquear.
          </Text>
          <Button label="Emergencia (SOS)" icon="alert" variant="danger" size="lg" onPress={() => router.push('/emergency')} />
          <Button label="Ficha médica" icon="heart" variant="soft" onPress={() => router.push('/medical-id')} />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
