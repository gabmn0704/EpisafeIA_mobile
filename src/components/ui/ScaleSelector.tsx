import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ScaleSelectorProps {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
  /** Color por posición (0..1): p. ej. más estrés = más cálido. */
  tone?: (ratio: number) => string;
}

export function ScaleSelector({ label, value, min, max, onChange, lowLabel, highLabel, tone }: ScaleSelectorProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={{ gap: 10 }}>
      <Text variant="label" color={colors.muted}>
        {label}
      </Text>
      <View style={styles.row}>
        {steps.map((n) => {
          const on = value === n;
          const color = tone ? tone((n - min) / (max - min)) : colors.lime;
          return (
            <PressableScale
              key={n}
              onPress={() => onChange(n)}
              accessibilityLabel={`${label}: ${n}`}
              accessibilityState={{ selected: on }}
              style={[styles.cell, on ? { backgroundColor: color, borderColor: color } : null]}
            >
              <Text variant="title" color={on ? '#12091f' : colors.muted} style={{ fontSize: 15 }}>
                {n}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      {lowLabel || highLabel ? (
        <View style={styles.legend}>
          <Text variant="small" color={colors.faint}>
            {lowLabel}
          </Text>
          <Text variant="small" color={colors.faint}>
            {highLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
});
