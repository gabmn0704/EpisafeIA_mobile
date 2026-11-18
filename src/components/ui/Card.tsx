import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, shadow, space } from '@/theme/tokens';

export interface CardProps {
  children: ReactNode;
  /** `raised` usa una superficie mas clara; `outline` solo borde. */
  tone?: 'default' | 'raised' | 'outline' | 'brand' | 'danger';
  style?: ViewStyle;
  padded?: boolean;
}

const tones: Record<NonNullable<CardProps['tone']>, { fill: readonly [string, string]; border: string }> = {
  default: { fill: ['#1a1643', '#120f31'], border: colors.line },
  raised: { fill: ['#262060', '#1a1642'], border: colors.lineStrong },
  outline: { fill: ['transparent', 'transparent'], border: colors.line },
  brand: { fill: ['rgba(145,114,255,0.28)', 'rgba(91,43,255,0.10)'], border: 'rgba(145,114,255,0.5)' },
  danger: { fill: ['rgba(255,92,120,0.24)', 'rgba(255,92,120,0.08)'], border: 'rgba(255,92,120,0.55)' },
};

/** Superficie con degradado vertical y un filo de luz arriba (una sola fuente de luz). */
export function Card({ children, tone = 'default', style, padded = true }: CardProps) {
  const t = tones[tone];
  const lifted = tone === 'default' || tone === 'raised';
  return (
    <View style={[styles.card, { borderColor: t.border }, lifted ? shadow.card : null, padded ? styles.padded : null, style]}>
      <LinearGradient colors={t.fill} style={StyleSheet.absoluteFill} />
      {lifted ? <View pointerEvents="none" style={styles.rim} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.surface },
  padded: { padding: space.lg },
  rim: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.14)' },
});
