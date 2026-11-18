import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface StepperProps {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (next: number) => void;
  format?: (v: number) => string;
  hint?: string;
}

/** Control +/- con valor grande: más rápido y seguro que teclear en un día malo. */
export function Stepper({ label, value, step, min, max, unit, onChange, format, hint }: StepperProps) {
  const set = (v: number) => onChange(Math.round(Math.min(max, Math.max(min, v)) * 100) / 100);
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text variant="label" color={colors.muted}>
          {label}
        </Text>
        <View style={styles.valueRow}>
          <Text variant="num" style={{ fontSize: 30 }}>
            {format ? format(value) : String(value)}
          </Text>
          {unit ? (
            <Text variant="small" color={colors.muted}>
              {unit}
            </Text>
          ) : null}
        </View>
        {hint ? (
          <Text variant="small" color={colors.faint}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.buttons}>
        <PressableScale onPress={() => set(value - step)} disabled={value <= min} accessibilityLabel={`Disminuir ${label}`} style={[styles.btn, value <= min ? { opacity: 0.35 } : null]}>
          <View style={styles.minus} />
        </PressableScale>
        <PressableScale onPress={() => set(value + step)} disabled={value >= max} accessibilityLabel={`Aumentar ${label}`} style={[styles.btn, styles.btnOn, value >= max ? { opacity: 0.35 } : null]}>
          <Icon name="plus" size={20} color={colors.limeInk} strokeWidth={2.6} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  buttons: { flexDirection: 'row', gap: space.sm },
  btn: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  btnOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  minus: { width: 16, height: 2.6, borderRadius: 2, backgroundColor: colors.ink, position: 'absolute' },
});
