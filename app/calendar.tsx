import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { QueryError } from '@/components/ui/QueryError';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useSeizures } from '@/hooks/queries';
import { groupByDay, MONTH_NAMES, monthGrid, shiftMonth, WEEKDAYS } from '@/lib/calendar';
import { formatDuration, formatTime, toDateKey } from '@/lib/dates';
import { colors, radius, space } from '@/theme/tokens';

export default function CrisisCalendar() {
  const list = useSeizures();
  const today = new Date();
  const [ym, setYm] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(toDateKey(today));

  const byDay = groupByDay(list.data?.seizures ?? []);
  const weeks = monthGrid(ym.year, ym.month);
  const monthCount = weeks.flat().filter((c) => c.inMonth && byDay.has(c.key)).length;
  const detail = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <Screen glow={colors.coral} refreshing={list.isRefetching} onRefresh={() => void list.refetch()}>
      <Header title="Calendario" subtitle="Los días con crisis aparecen marcados" back />

      {list.isLoading ? (
        <Skeleton height={320} rounded={22} />
      ) : list.isError ? (
        <QueryError error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <>
          <Card style={{ gap: space.md }}>
            <View style={styles.nav}>
              <PressableScale onPress={() => setYm((v) => shiftMonth(v.year, v.month, -1))} accessibilityLabel="Mes anterior" style={styles.navBtn} hitSlop={8}>
                <Icon name="chevronLeft" size={20} />
              </PressableScale>
              <Text variant="h2" style={{ textTransform: 'capitalize' }} accessibilityLiveRegion="polite">
                {MONTH_NAMES[ym.month]} {ym.year}
              </Text>
              <PressableScale onPress={() => setYm((v) => shiftMonth(v.year, v.month, 1))} accessibilityLabel="Mes siguiente" style={styles.navBtn} hitSlop={8}>
                <Icon name="chevronRight" size={20} />
              </PressableScale>
            </View>

            <View style={styles.week}>
              {WEEKDAYS.map((w, i) => (
                <Text key={`${w}${i}`} variant="label" color={colors.muted} center style={styles.cell}>
                  {w}
                </Text>
              ))}
            </View>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.week}>
                {week.map((c) => {
                  const n = byDay.get(c.key)?.length ?? 0;
                  const isSel = selected === c.key;
                  return (
                    <PressableScale
                      key={c.key}
                      onPress={() => setSelected(c.key)}
                      disabled={!c.inMonth}
                      accessibilityLabel={`${c.day} de ${MONTH_NAMES[ym.month]}${n > 0 ? `, ${n} crisis` : ', sin crisis'}`}
                      accessibilityState={{ selected: isSel, disabled: !c.inMonth }}
                      style={[styles.cell, styles.day, isSel ? styles.daySel : null, n > 0 ? styles.dayHit : null, !c.inMonth ? { opacity: 0.25 } : null]}
                    >
                      <Text variant="body" color={n > 0 ? colors.coral : colors.ink}>
                        {c.day}
                      </Text>
                      {n > 0 ? <View style={styles.dot} /> : null}
                    </PressableScale>
                  );
                })}
              </View>
            ))}
            <Text variant="small" color={colors.muted}>
              {monthCount === 0 ? 'Sin crisis este mes.' : `${monthCount} ${monthCount === 1 ? 'día' : 'días'} con crisis este mes.`}
            </Text>
          </Card>

          {selected ? (
            <View style={{ gap: space.md, marginTop: space.lg }}>
              <Text variant="label" color={colors.muted}>
                {selected}
              </Text>
              {detail.length === 0 ? (
                <Card>
                  <Text variant="body" color={colors.muted}>
                    No registraste crisis este día.
                  </Text>
                </Card>
              ) : (
                detail.map((s) => (
                  <Card key={s.id} style={{ gap: 4 }}>
                    <Text variant="title">
                      {formatTime(s.startedAt)} · {formatDuration(s.durationSeconds)}
                    </Text>
                    <Text variant="small" color={colors.muted}>
                      {[s.seizureType, s.severity ? `Severidad ${s.severity}/5` : null].filter(Boolean).join(' · ') || 'Sin más datos'}
                    </Text>
                    {s.triggersNoted.length > 0 ? (
                      <Text variant="small" color={colors.muted}>
                        Posibles desencadenantes: {s.triggersNoted.join(', ')}
                      </Text>
                    ) : null}
                    {s.notes ? <Text variant="small">{s.notes}</Text> : null}
                  </Card>
                ))
              )}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1 },
  day: { height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  daySel: { borderColor: colors.lime },
  dayHit: { backgroundColor: colors.coralSoft },
  dot: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.coral },
});
