import { StyleSheet } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: string;
}

export function Chip({ label, selected, onPress, tone = colors.lime }: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected ? { backgroundColor: tone, borderColor: tone } : null]}
    >
      <Text variant="small" color={selected ? colors.limeInk : colors.muted} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
});
