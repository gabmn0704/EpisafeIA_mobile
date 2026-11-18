import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { QueryError } from '@/components/ui/QueryError';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useDeleteSeizure, useSeizureStats, useSeizures } from '@/hooks/queries';
import { friendlyMessage } from '@/lib/api/errors';
import type { Seizure } from '@/lib/api/schemas';
import { formatDay, formatDuration, formatTime } from '@/lib/dates';
import { groupByMonth, severityTone } from '@/lib/seizureForm';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, space } from '@/theme/tokens';

const toneColor = { low: colors.amber, mid: '#ff8a3d', high: colors.coral, unknown: colors.faint } as const;
const sourceLabel: Record<Seizure['source'], string> = { manual: 'Manual', emergency: 'Emergencia', wearable: 'Reloj' };

export default function Crisis() {
  const list = useSeizures();
  const stats = useSeizureStats();
  const groups = groupByMonth(list.data?.seizures ?? []);
  const s = stats.data;

  return (
    <Screen
      bottomInset={90}
      refreshing={list.isRefetching}
      onRefresh={() => {
        void list.refetch();
        void stats.refetch();
      }}
      glow={colors.coral}
    >
      <Header title="Crisis" subtitle="Tu historial y qué lo rodea" />

      {s ? (
        <View style={styles.stats}>
          <Card tone="raised" style={styles.stat}>
            <Text variant="num">{s.total}</Text>
            <Text variant="small" color={colors.muted}>
              registradas
            </Text>
          </Card>
          <Card tone="raised" style={styles.stat}>
            <Text variant="num" color={colors.lime}>
              {s.daysSinceLast ?? '--'}
            </Text>
            <Text variant="small" color={colors.muted}>
              días desde la última
            </Text>
          </Card>
          <Card tone="raised" style={styles.stat}>
            <Text variant="num" color={colors.amber}>
              {s.lowSleepShare !== null ? `${Math.round(s.lowSleepShare * 100)}%` : '--'}
            </Text>
            <Text variant="small" color={colors.muted}>
              tras poco sueño
            </Text>
          </Card>
        </View>
      ) : null}

      <Button label="Registrar una crisis" icon="plus" onPress={() => router.push('/seizure-form')} variant="brand" style={{ marginVertical: space.lg }} />

      {list.isLoading ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={96} rounded={22} />
          <Skeleton height={96} rounded={22} />
        </View>
      ) : list.isError ? (
        <QueryError error={list.error} onRetry={() => void list.refetch()} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState icon="activity" tone={colors.lime} title="Sin crisis registradas" body="Cuando registres una, la verás aquí con su hora, duración y posibles desencadenantes." />
        </Card>
      ) : (
        groups.map((g) => (
          <View key={g.label} style={{ marginBottom: space.xl }}>
            <Text variant="label" color={colors.muted} style={styles.month}>
              {g.label}
            </Text>
            {g.items.map((it, i) => (
              <Animated.View key={it.id} entering={FadeInDown.delay(Math.min(i, 6) * 50).duration(350)} layout={LinearTransition}>
                <SeizureItem seizure={it} isLast={i === g.items.length - 1} />
              </Animated.View>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

function SeizureItem({ seizure, isLast }: { seizure: Seizure; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const del = useDeleteSeizure();
  const toast = useToast();
  const color = toneColor[severityTone(seizure.severity)];

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.node, { backgroundColor: color }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: space.md }}>
        <PressableScale onPress={() => setOpen((o) => !o)} accessibilityLabel={`Crisis del ${formatDay(seizure.startedAt)}`} accessibilityState={{ expanded: open }}>
          <Card style={{ gap: 6 }}>
            <View style={styles.head}>
              <Text variant="title">
                {formatDay(seizure.startedAt)} · {formatTime(seizure.startedAt)}
              </Text>
              <View style={[styles.source, seizure.source !== 'manual' ? { borderColor: colors.coral } : null]}>
                <Text variant="label" color={seizure.source !== 'manual' ? colors.coral : colors.muted}>
                  {sourceLabel[seizure.source]}
                </Text>
              </View>
            </View>
            <View style={styles.meta}>
              <Meta icon="clock" text={formatDuration(seizure.durationSeconds)} />
              <Meta icon="zap" text={seizure.severity ? `Severidad ${seizure.severity}/5` : 'Sin severidad'} />
              {seizure.seizureType ? <Meta icon="activity" text={seizure.seizureType} /> : null}
            </View>
            {open ? (
              <View style={{ gap: 8, marginTop: 6 }}>
                {seizure.triggersNoted.length > 0 ? (
                  <Text variant="small" color={colors.muted}>
                    Posibles desencadenantes: {seizure.triggersNoted.join(', ')}
                  </Text>
                ) : null}
                {seizure.notes ? <Text variant="small">{seizure.notes}</Text> : null}
                <Button
                  label="Eliminar registro"
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  loading={del.isPending}
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() =>
                    del.mutate(seizure.id, {
                      onSuccess: () => toast.show({ message: 'Registro eliminado', tone: 'warning' }),
                      onError: (e) => toast.error(friendlyMessage(e)),
                    })
                  }
                />
              </View>
            ) : null}
          </Card>
        </PressableScale>
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: 'clock' | 'zap' | 'activity'; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Icon name={icon} size={14} color={colors.muted} />
      <Text variant="small" color={colors.muted}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: 2, padding: space.md },
  month: { marginBottom: space.md, textTransform: 'capitalize' },
  row: { flexDirection: 'row', gap: space.md },
  rail: { width: 16, alignItems: 'center' },
  node: { width: 14, height: 14, borderRadius: 7, marginTop: 20 },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  source: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
