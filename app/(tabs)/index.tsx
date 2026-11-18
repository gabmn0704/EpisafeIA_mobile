import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PulseHeart } from '@/components/dashboard/PulseHeart';
import { FactorRow } from '@/components/dashboard/FactorRow';
import { StatTile } from '@/components/dashboard/StatTile';
import { Ring } from '@/components/charts/Ring';
import { RiskMeter } from '@/components/charts/RiskMeter';
import { Sparkline } from '@/components/charts/Sparkline';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheet, useSheet } from '@/components/ui/BottomSheet';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { QueryError } from '@/components/ui/QueryError';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useDashboard, useMedications, useRiskHistory } from '@/hooks/queries';
import { formatDateLong, greeting, timeAgo } from '@/lib/dates';
import { useAuth } from '@/providers/AuthProvider';
import { colors, riskPalette, space } from '@/theme/tokens';

const ALERT_COPY: Record<string, string> = {
  tachycardia: 'Taquicardia sostenida',
  motion_convulsive: 'Movimiento convulsivo',
  hr_anomaly: 'Pulso fuera de lo habitual',
  fall: 'Posible caída',
};

export default function Dashboard() {
  const { user } = useAuth();
  const dash = useDashboard();
  const history = useRiskHistory(14);
  const sheet = useSheet();
  const meds = useMedications();
  const hasMeds = (meds.data?.length ?? 0) > 0;
  const firstName = user?.fullName.split(' ')[0] ?? '';
  const d = dash.data;
  const palette = d ? riskPalette[d.risk.level] : null;
  const series = history.data?.assessments.map((a) => a.score) ?? [];

  return (
    <Screen
      bottomInset={112}
      refreshing={dash.isRefetching}
      onRefresh={() => {
        void dash.refetch();
        void history.refetch();
      }}
      glow={palette?.color ?? colors.brandDeep}
    >
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text variant="small" color={colors.muted}>
            {formatDateLong()}
          </Text>
          <Text variant="h1" style={{ marginTop: 2 }}>
            {greeting()}, {firstName}
          </Text>
        </View>
        <PressableScale onPress={() => router.push('/settings')} accessibilityLabel="Perfil y ajustes" style={styles.avatar}>
          <Text variant="title" color={colors.limeInk}>
            {firstName.charAt(0).toUpperCase() || 'E'}
          </Text>
        </PressableScale>
      </View>

      {dash.isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={300} rounded={28} />
          <Skeleton height={128} rounded={22} />
        </View>
      ) : dash.isError || !d || !palette ? (
        <QueryError error={dash.error} onRetry={() => void dash.refetch()} />
      ) : (
        <View style={{ gap: space.lg }}>
          {d.activeAlerts.count > 0 ? (
            <Animated.View entering={FadeInDown.duration(350)}>
              <PressableScale onPress={() => router.push('/devices')} accessibilityLabel="Ver alertas del reloj">
                <Card tone="danger" style={styles.alert}>
                  <Icon name="alert" size={22} color={colors.coral} />
                  <View style={{ flex: 1 }}>
                    <Text variant="title" color={colors.coral}>
                      {d.activeAlerts.count === 1 ? 'Alerta del reloj' : `${d.activeAlerts.count} alertas del reloj`}
                    </Text>
                    <Text variant="small" color={colors.ink}>
                      {d.activeAlerts.items[0] ? `${ALERT_COPY[d.activeAlerts.items[0].kind] ?? 'Alerta'} · ${timeAgo(d.activeAlerts.items[0].detectedAt)}` : 'Revisa tu reloj'}
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.coral} />
                </Card>
              </PressableScale>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(60).duration(450)}>
            <PressableScale onPress={sheet.show} accessibilityLabel="Ver cómo se calcula tu riesgo" pressedScale={0.985}>
            <View style={[styles.hero, { borderColor: palette.color }]}>
              <LinearGradient colors={[palette.soft, 'rgba(18,15,49,0.2)', 'rgba(18,15,49,0.0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.heroTop}>
                <View style={[styles.liveDot, { backgroundColor: palette.color }]} />
                <Text variant="label" color={colors.muted}>
                  Predicción de IA · hoy
                </Text>
                <View style={{ flex: 1 }} />
                <Text variant="label" color={palette.color}>
                  Cómo se calcula
                </Text>
                <Icon name="chevronRight" size={14} color={palette.color} />
              </View>
              <RiskMeter score={d.risk.score} level={d.risk.level} degraded={d.risk.degraded} />
              <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm }}>
                {palette.message}
              </Text>
              {series.length > 2 ? (
                <View style={styles.spark}>
                  <Text variant="label" color={colors.faint}>
                    Últimos {series.length} días
                  </Text>
                  <Sparkline values={series} min={0} max={100} color={palette.color} width={280} height={54} />
                </View>
              ) : null}
            </View>
            </PressableScale>
          </Animated.View>

          {d.risk.factors.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(120).duration(450)}>
              <Card style={{ gap: space.lg }}>
                <Text variant="h2">Qué mueve tu riesgo hoy</Text>
                {d.risk.factors.slice(0, 3).map((f, i) => (
                  <FactorRow key={f.name} factor={f} index={i} />
                ))}
              </Card>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(180).duration(450)} style={styles.tiles}>
            <StatTile
              label="Pulso"
              value={d.currentHeartRate !== null ? String(d.currentHeartRate) : '--'}
              unit={d.currentHeartRate !== null ? 'lpm' : undefined}
              caption={d.currentHeartRate !== null ? 'Último dato del reloj' : 'Sin reloj conectado'}
              accessory={<PulseHeart bpm={d.currentHeartRate} />}
              onPress={() => router.push('/devices')}
            />
            <StatTile
              label="Sin crisis"
              value={d.seizureFreeStreakDays !== null ? String(d.seizureFreeStreakDays) : '--'}
              unit={d.seizureFreeStreakDays !== null ? (d.seizureFreeStreakDays === 1 ? 'día' : 'días') : undefined}
              caption={d.seizureFreeStreakDays !== null ? 'Racha actual' : 'Aún no registras crisis'}
              accessory={<Icon name="flame" size={22} color={colors.amber} />}
              tone={colors.lime}
              onPress={() => router.push('/crisis')}
            />
          </Animated.View>

          {meds.isSuccess && !hasMeds ? (
            <Animated.View entering={FadeInDown.delay(240).duration(450)}>
              <PressableScale onPress={() => router.push('/medication-form')} accessibilityLabel="Agregar tu primer medicamento">
                <Card tone="outline" style={styles.adherence}>
                  <Icon name="pill" size={22} color={colors.brand} />
                  <View style={{ flex: 1 }}>
                    <Text variant="title">Agrega tu medicación</Text>
                    <Text variant="small" color={colors.muted}>
                      Escribe los medicamentos que tomas tú para activar recordatorios y seguir tu adherencia.
                    </Text>
                  </View>
                  <Icon name="plus" size={20} color={colors.lime} />
                </Card>
              </PressableScale>
            </Animated.View>
          ) : null}

          {hasMeds ? (
          <Animated.View entering={FadeInDown.delay(240).duration(450)}>
            <PressableScale onPress={() => router.push('/medications')} accessibilityLabel="Ver adherencia a medicamentos">
              <Card style={styles.adherence}>
                <Ring value={d.adherence.last7Rate} label="7 días" />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="h2">Adherencia</Text>
                  <Text variant="small" color={colors.muted}>
                    {d.adherence.rate !== null ? `${Math.round(d.adherence.rate * 100)}% en 30 días` : 'Aún sin dosis registradas'}
                  </Text>
                  <View style={styles.streak}>
                    <Icon name="flame" size={14} color={colors.amber} />
                    <Text variant="small" color={colors.ink}>
                      {d.adherence.streakDays} {d.adherence.streakDays === 1 ? 'día' : 'días'} seguidos tomando todo
                    </Text>
                  </View>
                </View>
                <Icon name="chevronRight" size={20} color={colors.faint} />
              </Card>
            </PressableScale>
          </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.tiles}>
            <ActionTile icon="edit" label="Registro de hoy" sub="Sueño, estrés, cafeína" onPress={() => router.push('/daily-log')} />
            <ActionTile icon="sparkles" label="Insights IA" sub="Tus patrones" onPress={() => router.push('/insights')} />
          </Animated.View>

          {d.lastSeizure ? (
            <Text variant="small" color={colors.faint} center>
              Última crisis registrada {timeAgo(d.lastSeizure.startedAt)}
            </Text>
          ) : null}
        </View>
      )}
      <BottomSheet visible={sheet.open} onClose={sheet.hide} title="Cómo se calcula" subtitle="La IA cruza lo que registras con lo que mide tu reloj. No es un diagnóstico.">
        <View style={{ gap: space.lg }}>
          {(d?.risk.factors ?? []).map((f, i) => (
            <FactorRow key={f.name} factor={f} index={i} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

function ActionTile({ icon, label, sub, onPress }: { icon: 'edit' | 'sparkles'; label: string; sub: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={{ flex: 1 }} accessibilityLabel={label}>
      <Card tone="brand" style={{ gap: 10, minHeight: 112 }}>
        <View style={styles.actionIcon}>
          <Icon name={icon} size={20} color={colors.limeInk} />
        </View>
        <View>
          <Text variant="title">{label}</Text>
          <Text variant="small" color={colors.muted}>
            {sub}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hero: { borderRadius: 32, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.surface, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl, alignItems: 'center' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch', marginBottom: space.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  spark: { marginTop: space.lg, alignItems: 'center', gap: 6 },
  tiles: { flexDirection: 'row', gap: space.md },
  adherence: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  actionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
