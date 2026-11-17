import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/tokens';

export interface RingProps {
  /** 0..1, o null si no hay datos. */
  value: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

/** Anillo de progreso (adherencia). Sin datos muestra un guion en lugar de un 0% engañoso. */
export function Ring({ value, size = 84, stroke = 9, color = colors.lime, label }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.min(1, Math.max(0, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface3} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          <Text variant="title" style={{ fontSize: size * 0.24 }}>
            {value === null ? '--' : `${Math.round(pct * 100)}%`}
          </Text>
          {label ? (
            <Text variant="small" color={colors.muted} style={{ fontSize: 10 }}>
              {label}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
