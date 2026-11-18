import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { colors, space } from '@/theme/tokens';

export interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  accessory?: ReactNode;
  onPress?: () => void;
  tone?: string;
}

export function StatTile({ label, value, unit, caption, accessory, onPress, tone = colors.ink }: StatTileProps) {
  const body = (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text variant="label" color={colors.muted}>
          {label}
        </Text>
        {accessory}
      </View>
      <View style={styles.valueRow}>
        <Text variant="num" color={tone}>
          {value}
        </Text>
        {unit ? (
          <Text variant="small" color={colors.muted}>
            {unit}
          </Text>
        ) : null}
      </View>
      {caption ? (
        <Text variant="small" color={colors.faint} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </Card>
  );
  if (!onPress) return <View style={styles.flex}>{body}</View>;
  return (
    <PressableScale onPress={onPress} style={styles.flex} accessibilityLabel={`${label}: ${value} ${unit ?? ''}`}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: 6, minHeight: 128, justifyContent: 'space-between', padding: space.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
});
