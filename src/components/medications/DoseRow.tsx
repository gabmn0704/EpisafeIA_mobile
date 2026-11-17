import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { ScheduledDose } from '@/lib/api/schemas';
import { formatTime } from '@/lib/dates';
import { colors, radius, space } from '@/theme/tokens';

export interface DoseRowProps {
  dose: ScheduledDose;
  isLast: boolean;
  busy?: boolean;
  onTake: () => void;
  onSkip: () => void;
}

const statusCopy = {
  taken: { label: 'Tomada', color: colors.ok },
  missed: { label: 'Omitida', color: colors.coral },
  skipped: { label: 'Saltada', color: colors.amber },
  pending: { label: 'Pendiente', color: colors.muted },
} as const;

/** Fila de la línea de tiempo del día: hora, medicamento y acciones. */
export function DoseRow({ dose, isLast, busy, onTake, onSkip }: DoseRowProps) {
  const done = dose.status === 'taken';
  const status = dose.overdue && dose.status === 'pending' ? { label: 'Atrasada', color: colors.coral } : statusCopy[dose.status];
  const amount = [dose.dose, dose.unit].filter(Boolean).join(' ');
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.node, done ? { backgroundColor: colors.lime, borderColor: colors.lime } : { borderColor: status.color }]}>
          {done ? <Icon name="check" size={14} color={colors.limeInk} strokeWidth={3} /> : null}
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={[styles.body, isLast ? null : { paddingBottom: space.xl }]}>
        <View style={styles.head}>
          <Text variant="h2" style={done ? { opacity: 0.55 } : null}>
            {formatTime(dose.scheduledFor)}
          </Text>
          <View style={[styles.pill, { borderColor: status.color }]}>
            <Text variant="label" color={status.color}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text variant="title" style={done ? { opacity: 0.55 } : null}>
          {dose.name}
        </Text>
        {amount ? (
          <Text variant="small" color={colors.muted}>
            {amount}
          </Text>
        ) : null}
        {dose.status === 'pending' ? (
          <View style={styles.actions}>
            <PressableScale onPress={onTake} disabled={busy} accessibilityLabel={`Marcar ${dose.name} como tomada`} style={styles.take}>
              <Icon name="check" size={18} color={colors.limeInk} strokeWidth={3} />
              <Text variant="small" color={colors.limeInk} style={{ fontWeight: '700' }}>
                Ya la tomé
              </Text>
            </PressableScale>
            <PressableScale onPress={onSkip} disabled={busy} accessibilityLabel={`Omitir ${dose.name}`} style={styles.skip}>
              <Text variant="small" color={colors.muted}>
                Omitir
              </Text>
            </PressableScale>
          </View>
        ) : dose.takenAt ? (
          <Text variant="small" color={colors.faint}>
            Marcada a las {formatTime(dose.takenAt)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: 24 },
  node: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4 },
  body: { flex: 1, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, alignItems: 'center' },
  take: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 16, height: 40 },
  skip: { paddingHorizontal: 14, height: 40, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
});
