import { ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { useOfflineQueue } from '@/providers/OfflineQueueProvider';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Aviso visible cuando hay registros guardados en el teléfono sin enviar. Al tocarlo reintenta. */
export function PendingSyncBanner() {
  const { pending, syncing, syncNow } = useOfflineQueue();
  if (pending === 0) return null;
  const label = pending === 1 ? '1 registro pendiente de enviar' : `${pending} registros pendientes de enviar`;
  return (
    <PressableScale
      onPress={() => void syncNow()}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toca para reintentar ahora.`}
      accessibilityLiveRegion="polite"
      style={styles.box}
    >
      {syncing ? <ActivityIndicator color={colors.amber} /> : <Icon name="refresh" size={22} color={colors.amber} />}
      <Text variant="title" color={colors.amber} style={{ flex: 1 }}>
        {syncing ? 'Enviando…' : label}
      </Text>
      {!syncing ? (
        <Text variant="label" color={colors.amber}>
          Reintentar
        </Text>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    marginBottom: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.amber,
    backgroundColor: 'rgba(255,192,68,0.12)',
  },
});
