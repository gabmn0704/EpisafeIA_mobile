import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LogoMark } from '@/components/ui/Logo';

/** Indicador de carga de marca: el escudo late suave. Con "reducir movimiento" queda quieto. */
export function BrandLoader({ size = 72 }: { size?: number }) {
  const reduce = useReducedMotion();
  const beat = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    beat.value = withRepeat(withSequence(withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1);
  }, [reduce, beat]);
  const style = useAnimatedStyle(() => ({ opacity: 0.8 + beat.value * 0.2, transform: [{ scale: 1 + beat.value * 0.07 }] }));
  return (
    <Animated.View style={style} accessibilityRole="progressbar" accessibilityLabel="Cargando">
      <LogoMark size={size} />
    </Animated.View>
  );
}
