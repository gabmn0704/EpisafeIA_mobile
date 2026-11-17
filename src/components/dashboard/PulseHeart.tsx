import { useEffect } from 'react';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

/** Corazón que late al ritmo real del pulso. Sin pulso, queda quieto y apagado. */
export function PulseHeart({ bpm, size = 26 }: { bpm: number | null; size?: number }) {
  const s = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(s);
    if (!bpm || bpm <= 0) {
      s.value = withTiming(1);
      return;
    }
    const beat = 60_000 / bpm;
    s.value = withRepeat(
      withSequence(withTiming(1.22, { duration: beat * 0.18, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: beat * 0.82, easing: Easing.in(Easing.quad) })),
      -1,
    );
    return () => cancelAnimation(s);
  }, [bpm, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={anim}>
      <Icon name="heart" size={size} color={bpm ? colors.coral : colors.faint} />
    </Animated.View>
  );
}
