import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Glow } from '@/components/ui/Glow';
import { Text } from '@/components/ui/Text';
import { BRAND, DOT, SHIELD_INNER, SHIELD_OUTER, WAVE } from '@/theme/brandMark';
import { colors } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const WAVE_LENGTH = 1000;
const SIZE = 200;

export interface BrandIntroProps {
  onDone: () => void;
}

/**
 * Entrada de marca (~1,8 s): el escudo se forma con resorte, la onda se traza, el punto de alerta aparece
 * y todo se desvanece hacia la app. Se salta al tocar. Con "reducir movimiento" solo hay un fundido corto.
 * El fondo coincide con el splash nativo para que el paso sea continuo.
 */
export function BrandIntro({ onDone }: BrandIntroProps) {
  const reduce = useReducedMotion();
  const shield = useSharedValue(reduce ? 1 : 0.6);
  const shieldOpacity = useSharedValue(reduce ? 1 : 0);
  const wave = useSharedValue(reduce ? 0 : WAVE_LENGTH);
  const dot = useSharedValue(reduce ? 1 : 0);
  const glow = useSharedValue(0);
  const word = useSharedValue(reduce ? 1 : 0);
  const out = useSharedValue(1);

  useEffect(() => {
    if (reduce) {
      out.value = withDelay(500, withTiming(0, { duration: 200 }, (done) => done && runOnJS(onDone)()));
      return;
    }
    shieldOpacity.value = withTiming(1, { duration: 220 });
    shield.value = withSpring(1, { damping: 11, stiffness: 150 });
    wave.value = withDelay(380, withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) }));
    dot.value = withDelay(1000, withSpring(1, { damping: 8, stiffness: 220 }));
    glow.value = withDelay(900, withSequence(withTiming(1, { duration: 300 }), withTiming(0.45, { duration: 500 })));
    word.value = withDelay(800, withTiming(1, { duration: 400 }));
    out.value = withDelay(1650, withTiming(0, { duration: 280 }, (done) => done && runOnJS(onDone)()));
  }, [reduce, onDone, shield, shieldOpacity, wave, dot, glow, word, out]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  const markStyle = useAnimatedStyle(() => ({ opacity: shieldOpacity.value, transform: [{ scale: shield.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 8 }] }));
  const waveProps = useAnimatedProps(() => ({ strokeDashoffset: wave.value }));
  const dotProps = useAnimatedProps(() => ({ r: DOT.r * dot.value }));

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="auto">
      <Pressable style={styles.fill} onPress={onDone} accessibilityRole="button" accessibilityLabel="Omitir animación de entrada">
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Glow color={BRAND.violetDeep} size={420} opacity={0.7} />
        </Animated.View>
        <Animated.View style={markStyle}>
          <Svg width={SIZE} height={SIZE * 1.04} viewBox="96 96 832 864">
            <Defs>
              <LinearGradient id="introShield" x1="0.15" y1="0" x2="0.85" y2="1">
                <Stop offset="0" stopColor={BRAND.violet} />
                <Stop offset="1" stopColor={BRAND.violetDeep} />
              </LinearGradient>
            </Defs>
            <Path d={SHIELD_OUTER} fill="url(#introShield)" />
            <Path d={SHIELD_INNER} fill={BRAND.panel} />
            <AnimatedPath
              d={WAVE}
              fill="none"
              stroke={BRAND.lime}
              strokeWidth={58}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${WAVE_LENGTH} ${WAVE_LENGTH}`}
              animatedProps={waveProps}
            />
            <AnimatedCircle cx={DOT.cx} cy={DOT.cy} fill={BRAND.lime} animatedProps={dotProps} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.word, wordStyle]}>
          <Text variant="h1" accessibilityRole="header">
            EpiSafe <Text variant="h1" color={colors.lime}>IA</Text>
          </Text>
        </Animated.View>
        <View style={styles.spacer} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...(StyleSheet.absoluteFill as object), backgroundColor: BRAND.night, zIndex: 200 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  word: { marginTop: 28 },
  spacer: { height: 40 },
});
