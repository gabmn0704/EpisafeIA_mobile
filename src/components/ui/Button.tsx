import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'brand' | 'ghost' | 'danger' | 'soft';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: ViewStyle;
  accessibilityHint?: string;
}

const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.lime, fg: colors.limeInk, border: colors.lime },
  brand: { bg: colors.brand, fg: colors.brandInk, border: colors.brand },
  ghost: { bg: 'transparent', fg: colors.ink, border: colors.line },
  soft: { bg: colors.surface2, fg: colors.ink, border: colors.surface2 },
  danger: { bg: colors.coral, fg: '#2a0510', border: colors.coral },
};

const heights = { sm: 40, md: 52, lg: 60 } as const;

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, size = 'md', style, accessibilityHint }: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <PressableScale
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border, height: heights[size], opacity: disabled ? 0.45 : 1 },
        variant === 'primary' ? styles.limeGlow : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={p.fg} /> : null}
          <Text variant={size === 'sm' ? 'small' : 'title'} color={p.fg} style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontWeight: '600' },
  limeGlow: { shadowColor: colors.lime, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
