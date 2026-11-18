import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { BRAND, DOT, SHIELD_INNER, SHIELD_OUTER, WAVE } from '@/theme/brandMark';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

/** Símbolo de EpiSafe IA (escudo + onda de actividad) y, opcionalmente, el nombre. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="96 96 832 864">
      <Defs>
        <LinearGradient id="logoShield" x1="0.15" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor={BRAND.violet} />
          <Stop offset="1" stopColor={BRAND.violetDeep} />
        </LinearGradient>
      </Defs>
      <Path d={SHIELD_OUTER} fill="url(#logoShield)" />
      <Path d={SHIELD_INNER} fill={BRAND.panel} />
      <Path d={WAVE} fill="none" stroke={BRAND.lime} strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={DOT.cx} cy={DOT.cy} r={DOT.r} fill={BRAND.lime} />
    </Svg>
  );
}

export function Logo({ size = 34, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="EpiSafe IA">
      <LogoMark size={size * 1.15} />
      {showWord ? (
        <Text variant="h2" style={{ fontSize: size * 0.64 }}>
          EpiSafe <Text variant="h2" color={colors.lime} style={{ fontSize: size * 0.64 }}>IA</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
