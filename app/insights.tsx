import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { QueryError } from '@/components/ui/QueryError';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useInsights, useRefreshInsights } from '@/hooks/queries';
import { friendlyMessage } from '@/lib/api/errors';
import { formatEvidence, insightKind } from '@/lib/insightEvidence';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, space } from '@/theme/tokens';

export default function Insights() {
  const q = useInsights();
  const refresh = useRefreshInsights();
  const toast = useToast();
  const items = q.data?.insights ?? [];

  return (
    <Screen glow={colors.cyan} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <Header title="Insights IA" subtitle="Patrones en tus datos, con evidencia" back />

      <Button
        label="Analizar de nuevo"
        icon="refresh"
        variant="brand"
        loading={refresh.isPending}
        onPress={() =>
          refresh.mutate(undefined, {
            onSuccess: () => toast.success('Análisis actualizado'),
            onError: (e) => toast.error(friendlyMessage(e)),
          })
        }
        style={{ marginBottom: space.lg }}
      />

      {q.data?.degraded ? (
        <Card tone="outline" style={styles.notice}>
          <Icon name="info" size={18} color={colors.amber} />
          <Text variant="small" color={colors.muted} style={{ flex: 1 }}>
            El servicio de IA no respondió; mostramos un análisis estadístico simplificado.
          </Text>
        </Card>
      ) : null}

      {q.isLoading ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={150} rounded={22} />
          <Skeleton height={150} rounded={22} />
        </View>
      ) : q.isError ? (
        <QueryError error={q.error} onRetry={() => void q.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon="sparkles" tone={colors.cyan} title="Aún no hay patrones" body="Registra tu día y tus crisis durante algunas semanas. La IA solo reporta algo cuando hay suficientes casos para respaldarlo." />
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          {items.map((it, i) => {
            const meta = insightKind(it.kind);
            const evidence = formatEvidence(it.evidence);
            return (
              <Animated.View key={it.id ?? `${it.kind}-${i}`} entering={FadeInDown.delay(Math.min(i, 6) * 70).duration(400)}>
                <Card tone="raised" style={{ gap: space.md }}>
                  <View style={styles.kind}>
                    <View style={styles.kindIcon}>
                      <Icon name={meta.icon} size={16} color={colors.cyan} />
                    </View>
                    <Text variant="label" color={colors.cyan}>
                      {meta.label}
                    </Text>
                  </View>
                  <Text variant="h2">{it.title}</Text>
                  <Text variant="body" color={colors.muted}>
                    {it.body}
                  </Text>
                  {evidence.length > 0 ? (
                    <View style={styles.evidence}>
                      {evidence.map((e) => (
                        <View key={e.label} style={styles.ev}>
                          <Text variant="label" color={colors.faint}>
                            {e.label}
                          </Text>
                          <Text variant="title">{e.value}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              </Animated.View>
            );
          })}
        </View>
      )}

      <Card tone="outline" style={{ ...styles.notice, marginTop: space.xl }}>
        <Icon name="shield" size={18} color={colors.lime} />
        <Text variant="small" color={colors.muted} style={{ flex: 1 }}>
          Esto no es un diagnóstico ni cambia tu tratamiento. Comparte estos patrones con tu neurólogo antes de tomar decisiones.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kindIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#0d2c3a', alignItems: 'center', justifyContent: 'center' },
  evidence: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  ev: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, minWidth: 84 },
});
