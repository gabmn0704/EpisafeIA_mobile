import { useEffect } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radius } from '@/theme/tokens';

export interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  rounded?: number;
  style?: ViewStyle;
}

/** Placeholder pulsante mientras carga una consulta. */
export function Skeleton({ height = 16, width = '100%', rounded = radius.sm, style }: SkeletonProps) {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.75, { duration: 900 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ height, width, borderRadius: rounded, backgroundColor: colors.surface3 }, anim, style]} />;
}
