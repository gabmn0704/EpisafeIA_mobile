import { StyleSheet, View } from 'react-native';
import { Sparkline } from '@/components/charts/Sparkline';
import { PulseHeart } from '@/components/dashboard/PulseHeart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useDevices, useWearableSummary } from '@/hooks/queries';
import { getHealthProvider } from '@/lib/health/StubHealthProvider';
import { timeAgo } from '@/lib/dates';
import { useWearable } from '@/providers/WearableProvider';
import { colors, space } from '@/theme/tokens';

const STATUS_COPY: Record<string, string> = {
  idle: 'Sin dispositivo conectado',
  unavailable: 'Bluetooth no disponible',
  scanning: 'Buscando relojes cercanos…',
  connecting: 'Conectando…',
  connected: 'Conectado',
  reconnecting: 'Reconectando…',
  error: 'Hubo un problema',
};

export default function Devices() {
  const w = useWearable();
  const devices = useDevices();
  const summary = useWearableSummary();
  const health = getHealthProvider();
  const s = w.state;
  const connected = s.status === 'connected';
  const busy = s.status === 'scanning' || s.status === 'connecting' || s.status === 'reconnecting';

  return (
    <Screen glow={colors.lime} refreshing={devices.isRefetching} onRefresh={() => void devices.refetch()}>
      <Header title="Reloj" subtitle="Pulso en tiempo real por Bluetooth" back />

      {!w.availability.available ? (
        <Card tone="outline" style={{ gap: space.md }}>
          <View style={styles.rowCenter}>
            <Icon name="bluetooth" size={22} color={colors.amber} />
            <Text variant="title">Conexión no disponible aquí</Text>
          </View>
          <Text variant="body" color={colors.muted}>
            {w.availability.message}
          </Text>
        </Card>
      ) : (
        <View style={{ gap: space.lg }}>
          <Card tone="raised" style={{ gap: space.lg }}>
            <View style={styles.rowCenter}>
              <PulseHeart bpm={connected ? s.lastHeartRate : null} size={30} />
              <View style={{ flex: 1 }}>
                <Text variant="title">{s.device?.name ?? STATUS_COPY[s.status]}</Text>
                <Text variant="small" color={connected ? colors.lime : colors.muted}>
                  {s.device ? STATUS_COPY[s.status] : 'Ningún reloj vinculado'}
                </Text>
              </View>
            </View>

            {connected ? (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text variant="display" style={{ fontSize: 64, lineHeight: 70 }}>
                    {s.lastHeartRate ?? '--'}
                  </Text>
                  <Text variant="body" color={colors.muted}>
                    lpm
                  </Text>
                </View>
                {s.contactDetected === false ? (
                  <Text variant="small" color={colors.amber}>
                    El reloj no detecta contacto con tu piel: ajústalo a la muñeca.
                  </Text>
                ) : null}
                {w.live.length > 1 ? <Sparkline values={w.live} color={colors.coral} width={280} height={70} /> : <Text variant="small" color={colors.faint}>Esperando las primeras lecturas…</Text>}
              </View>
            ) : (
              <Text variant="small" color={colors.faint}>
                No mostramos pulso mientras no haya un dispositivo real conectado: nunca usamos datos simulados.
              </Text>
            )}

            {s.message ? (
              <Text variant="small" color={s.status === 'error' ? colors.coral : colors.muted} accessibilityLiveRegion="polite">
                {s.message}
              </Text>
            ) : null}

            {connected ? (
              <Button label="Desconectar" variant="ghost" onPress={() => void w.disconnect()} />
            ) : (
              <Button label={s.status === 'scanning' ? 'Buscando…' : 'Buscar mi reloj'} icon="bluetooth" loading={busy} onPress={() => void w.scan()} />
            )}
          </Card>

          {s.status === 'scanning' || (s.found.length > 0 && !connected) ? (
            <View style={{ gap: space.sm }}>
              <Text variant="h2">Dispositivos encontrados</Text>
              {s.found.length === 0 ? (
                <Text variant="small" color={colors.muted}>
                  Activa el modo de emisión de pulso en tu reloj o banda (Heart Rate Broadcast) y acércalo al teléfono.
                </Text>
              ) : null}
              {s.found.map((d) => (
                <PressableScale key={d.id} onPress={() => void w.connect(d)} accessibilityLabel={`Conectar con ${d.name ?? 'dispositivo'}`}>
                  <Card style={styles.rowCenter}>
                    <Icon name="watch" size={22} color={colors.lime} />
                    <View style={{ flex: 1 }}>
                      <Text variant="title">{d.name ?? 'Dispositivo sin nombre'}</Text>
                      <Text variant="small" color={colors.faint}>
                        {d.rssi !== null ? `Señal ${d.rssi} dBm` : d.id}
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={18} color={colors.faint} />
                  </Card>
                </PressableScale>
              ))}
            </View>
          ) : null}

          {connected ? (
            <Card style={{ gap: 6 }}>
              <Text variant="label" color={colors.muted}>
                Envío al servidor
              </Text>
              <Text variant="body">
                {w.pendingSamples} muestras en cola{w.droppedSamples > 0 ? ` · ${w.droppedSamples} descartadas por falta de red` : ''}
              </Text>
              <Text variant="small" color={w.uploadError ? colors.coral : colors.faint}>
                {w.uploadError ?? (w.lastUploadAt ? `Último envío ${timeAgo(new Date(w.lastUploadAt).toISOString())}` : 'Se envían por lotes cada 15 segundos.')}
              </Text>
            </Card>
          ) : null}
        </View>
      )}

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Text variant="h2">Últimas 24 horas</Text>
        {summary.data && summary.data.samples > 0 ? (
          <View style={styles.tiles}>
            <Mini label="Promedio" value={summary.data.heartRate.avg} unit="lpm" />
            <Mini label="Mínimo" value={summary.data.heartRate.min} unit="lpm" />
            <Mini label="Máximo" value={summary.data.heartRate.max} unit="lpm" />
          </View>
        ) : (
          <Card tone="outline">
            <Text variant="small" color={colors.muted}>
              Aún no hay muestras del reloj en las últimas 24 horas.
            </Text>
          </Card>
        )}
      </View>

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Text variant="h2">Salud del sistema</Text>
        <Card tone="outline" style={{ gap: 6 }}>
          <View style={styles.rowCenter}>
            <Icon name="heart" size={20} color={colors.faint} />
            <Text variant="title" style={{ flex: 1 }}>
              {health.platform === 'apple_health' ? 'Apple Salud (HealthKit)' : 'Health Connect (Android)'}
            </Text>
            <View style={styles.pending}>
              <Text variant="label" color={colors.amber}>
                Pendiente
              </Text>
            </View>
          </View>
          <Text variant="small" color={colors.muted}>
            La integración con los datos de salud del teléfono aún no está implementada. La interfaz HealthProvider está lista; falta la implementación nativa (requiere development build y permisos).
          </Text>
        </Card>
      </View>

      {(devices.data?.length ?? 0) > 0 ? (
        <View style={{ gap: space.md, marginTop: space.xl }}>
          <Text variant="h2">Vinculados a tu cuenta</Text>
          {devices.data?.map((d) => (
            <Card key={d.id} style={styles.rowCenter}>
              <Icon name="watch" size={20} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text variant="title">{d.deviceName ?? 'Dispositivo'}</Text>
                <Text variant="small" color={colors.faint}>
                  {d.lastSeenAt ? `Visto ${timeAgo(d.lastSeenAt)}` : 'Sin actividad'}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function Mini({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <Card style={{ flex: 1, gap: 2, padding: space.md }}>
      <Text variant="label" color={colors.muted}>
        {label}
      </Text>
      <Text variant="num" style={{ fontSize: 26 }}>
        {value !== null ? Math.round(value) : '--'}
      </Text>
      <Text variant="small" color={colors.faint}>
        {unit}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tiles: { flexDirection: 'row', gap: space.sm },
  pending: { borderWidth: 1, borderColor: colors.amber, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
});
