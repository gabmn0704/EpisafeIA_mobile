import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ensureServerAwake, serverWake } from '@/lib/api/serverWake';
import { WAKE_MAX_MS } from '@/lib/api/wake';
import { colors, radius, space } from '@/theme/tokens';
import { Button } from './Button';
import { Logo } from './Logo';
import { Text } from './Text';

/** Cubre la app mientras el servidor gratuito despierta: barra de progreso, reintento automatico y reintento manual. */
export function WakeOverlay() {
  const wake = useSyncExternalStore(serverWake.subscribe, serverWake.get, serverWake.get);
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const wasWaking = useRef(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    void ensureServerAwake();
  }, []);

  useEffect(() => {
    if (wake.phase !== 'waking') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [wake.phase]);

  useEffect(() => {
    if (wake.phase === 'waking') wasWaking.current = true;
    if (wake.phase === 'ready' && wasWaking.current) {
      wasWaking.current = false;
      void queryClient.invalidateQueries();
    }
  }, [wake.phase, queryClient]);

  const elapsed = wake.phase === 'waking' ? Math.max(0, now - wake.startedAt) : 0;
  useEffect(() => {
    progress.value = withTiming(Math.min(0.97, elapsed / WAKE_MAX_MS), { duration: 600 });
  }, [elapsed, progress]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (wake.phase !== 'waking' && wake.phase !== 'failed') return null;
  const failed = wake.phase === 'failed';
  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(250)} style={styles.root} accessibilityViewIsModal accessibilityLiveRegion="polite">
      <Logo />
      <Text variant="h1" center style={{ marginTop: space.xxl }}>
        {failed ? 'No logramos conectar' : 'Despertando el servidor…'}
      </Text>
      <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm, maxWidth: 300 }}>
        {failed
          ? 'Revisa tu conexión a internet e inténtalo de nuevo.'
          : elapsed > 20_000
            ? 'La primera vez del día puede tardar hasta un minuto. Seguimos intentándolo por ti.'
            : 'Estamos preparando tu información. Será solo un momento.'}
      </Text>
      {failed ? (
        <Button label="Reintentar" icon="refresh" onPress={() => void ensureServerAwake(true)} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
      ) : (
        <View style={styles.track}>
          <Animated.View style={[styles.fill, bar]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill as object, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, zIndex: 100 },
  track: { marginTop: space.xl, alignSelf: 'stretch', height: 8, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.lime },
});
