import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { colors, motion, radius, space } from '@/theme/tokens';
import { Text } from './Text';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Hoja inferior nativa: sube con resorte, se cierra arrastrando hacia abajo
 * (por distancia o por velocidad) o tocando el fondo. Con friccion al arrastrar hacia arriba.
 */
export function BottomSheet({ visible, onClose, title, subtitle, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(height);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      y.value = withSpring(0, motion.springSoft);
    } else if (mounted) {
      y.value = withTiming(height, { duration: motion.base, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, height]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      y.value = e.translationY > 0 ? e.translationY : e.translationY * 0.12;
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        y.value = withSpring(0, motion.spring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, height], [1, 0], 'clamp') }));

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" accessibilityRole="button" />
        </Animated.View>
        <View style={styles.dock} pointerEvents="box-none">
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + space.xl }, sheetStyle]} accessibilityViewIsModal>
              <View style={styles.grabber} />
              {title ? (
                <View style={{ marginBottom: space.lg }}>
                  <Text variant="h1" accessibilityRole="header">
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text variant="body" color={colors.muted} style={{ marginTop: 4 }}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {children}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** Abre/cierra con la vibracion adecuada. */
export function useSheet(initial = false) {
  const [open, setOpen] = useState(initial);
  return {
    open,
    show: () => {
      haptic.tap();
      setOpen(true);
    },
    hide: () => setOpen(false),
  };
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.scrim },
  dock: { flex: 1, justifyContent: 'flex-end', maxWidth: 560, width: '100%', alignSelf: 'center' },
  sheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.lineStrong,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: space.lg },
});
