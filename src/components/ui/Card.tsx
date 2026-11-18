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

const tones: Record<NonNullable<CardProps['tone']>, ViewStyle> = {
  default: { backgroundColor: colors.surface, borderColor: colors.line },
  raised: { backgroundColor: colors.surface2, borderColor: colors.line },
  outline: { backgroundColor: 'transparent', borderColor: colors.line },
  brand: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  danger: { backgroundColor: colors.coralSoft, borderColor: colors.coral },
};

export function Card({ children, tone = 'default', style, padded = true }: CardProps) {
  return <View style={[styles.card, tones[tone], tone === 'default' || tone === 'raised' ? shadow.card : null, padded ? styles.padded : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2 },
  padded: { padding: space.lg },
});
