import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { useCountUp } from '@/hooks/useCountUp';
import { colors, fonts, riskPalette, type RiskLevelKey } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 248;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const ARC = C * 0.75; // 270 grados

export interface RiskMeterProps {
  score: number;
  level: RiskLevelKey;
  degraded?: boolean;
}

/** Medidor circular de riesgo: el arco se llena con resorte y el número cuenta hacia arriba. */
export function RiskMeter({ score, level, degraded }: RiskMeterProps) {
  const progress = useSharedValue(0);
  const palette = riskPalette[level];
  const shown = useCountUp(score);

  useEffect(() => {
    progress.value = withTiming(Math.min(100, Math.max(0, score)) / 100, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [score, progress]);

  const fill = useAnimatedProps(() => ({ strokeDasharray: [progress.value * ARC, C] as unknown as string }));

  return (
    <View style={styles.wrap} accessible accessibilityRole="progressbar" accessibilityLabel={`Riesgo de crisis hoy: ${score} de 100, nivel ${palette.label}`}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '135deg' }] }}>
        <Defs>
          <LinearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={palette.color} />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.surface3} strokeWidth={STROKE} strokeLinecap="round" fill="none" strokeDasharray={`${ARC} ${C}`} />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="url(#riskGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          animatedProps={fill}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text variant="label" color={colors.muted}>
          Riesgo hoy
        </Text>
        <Text style={[styles.score, { color: colors.ink }]}>{shown}</Text>
        <View style={[styles.pill, { backgroundColor: palette.color }]}>
          <Text variant="label" color="#12091f">
            {palette.label}
          </Text>
        </View>
        {degraded ? (
          <Text variant="small" color={colors.faint} style={{ marginTop: 6 }}>
            Estimación simplificada
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.displayHeavy, fontSize: 76, lineHeight: 82, letterSpacing: -3 },
  pill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 2 },
});
