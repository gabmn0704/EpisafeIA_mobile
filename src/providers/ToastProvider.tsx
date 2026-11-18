import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { haptic } from '@/lib/haptics';
import { ToastQueue, type Toast, type ToastInput } from '@/lib/toastQueue';
import { colors, radius, space } from '@/theme/tokens';

interface ToastApi {
  show: (input: ToastInput | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneColor: Record<Toast['tone'], string> = {
  info: colors.brand,
  success: colors.ok,
  error: colors.coral,
  warning: colors.amber,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Toast | null>(null);
  const [queue] = useState(() => new ToastQueue(setCurrent));
  const insets = useSafeAreaInsets();

  useEffect(() => () => queue.clear(), [queue]);

  const api = useMemo<ToastApi>(() => {
    const q = queue;
    const show = (input: ToastInput | string) => q.show(typeof input === 'string' ? { message: input } : input);
    return {
      show,
      success: (message) => {
        haptic.success();
        show({ message, tone: 'success' });
      },
      error: (message) => {
        haptic.error();
        show({ message, tone: 'error', durationMs: 5000 });
      },
    };
  }, [queue]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + space.sm }]}>
        {current ? (
          <Animated.View key={current.id} entering={FadeInUp.springify().damping(16)} exiting={FadeOutDown.duration(160)} style={[styles.toast, { borderColor: toneColor[current.tone] }]}>
            <View style={[styles.dot, { backgroundColor: toneColor[current.tone] }]} />
            <Text variant="small" style={styles.message} accessibilityLiveRegion="polite">
              {current.message}
            </Text>
            {current.actionLabel ? (
              <PressableScale
                onPress={() => {
                  current.onAction?.();
                  queue.dismiss();
                }}
                hitSlop={8}
              >
                <Text variant="label" color={colors.lime}>
                  {current.actionLabel}
                </Text>
              </PressableScale>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: space.lg, right: space.lg, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface3,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    maxWidth: 520,
    width: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  message: { flex: 1 },
});
