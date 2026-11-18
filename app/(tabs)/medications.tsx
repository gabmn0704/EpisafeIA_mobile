import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ring } from '@/components/charts/Ring';
import { DoseRow } from '@/components/medications/DoseRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { QueryError } from '@/components/ui/QueryError';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAdherence, useDosesToday, useLogDose, useMedications } from '@/hooks/queries';
import { friendlyMessage } from '@/lib/api/errors';
import type { MedicationStatus, ScheduledDose } from '@/lib/api/schemas';
import { Stack } from '@/lib/structures';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

interface DoseChange {
  medicationId: string;
  scheduledFor: string;
  previous: MedicationStatus;
  name: string;
}

export default function Medications() {
  const doses = useDosesToday();
  const meds = useMedications();
  const adherence = useAdherence(7);
  const logDose = useLogDose();
  const toast = useToast();
  // Pila de cambios para poder deshacer la última marca (LIFO).
  const undoStack = useRef(new Stack<DoseChange>(10));

  const apply = (d: ScheduledDose, status: MedicationStatus) => {
    undoStack.current.push({ medicationId: d.medicationId, scheduledFor: d.scheduledFor, previous: d.status, name: d.name });
    logDose.mutate(
      { medicationId: d.medicationId, scheduledFor: d.scheduledFor, status },
      {
        onSuccess: () =>
          toast.show({
            message: status === 'taken' ? `${d.name} marcada como tomada` : `${d.name} omitida`,
            tone: status === 'taken' ? 'success' : 'warning',
            actionLabel: 'Deshacer',
            onAction: undo,
          }),
        onError: (e) => {
          undoStack.current.pop();
          toast.error(friendlyMessage(e));
        },
      },
    );
  };

  const undo = () => {
    const last = undoStack.current.pop();
    if (!last) return;
    logDose.mutate({ medicationId: last.medicationId, scheduledFor: last.scheduledFor, status: last.previous }, { onError: (e) => toast.error(friendlyMessage(e)) });
  };

  const list = doses.data ?? [];
  const taken = list.filter((d) => d.status === 'taken').length;
  const progress = list.length ? taken / list.length : null;

  return (
    <Screen
      bottomInset={112}
      refreshing={doses.isRefetching}
      onRefresh={() => {
        void doses.refetch();
        void meds.refetch();
        void adherence.refetch();
      }}
    >
      <Header
        title="Medicinas"
        subtitle="Tu agenda de hoy"
        right={
          <PressableScale onPress={() => router.push('/medication-form')} accessibilityLabel="Agregar medicamento" style={styles.add}>
            <Icon name="plus" size={22} color={colors.limeInk} strokeWidth={2.6} />
          </PressableScale>
        }
      />

      {doses.isLoading ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={110} rounded={22} />
          <Skeleton height={180} rounded={22} />
        </View>
      ) : doses.isError ? (
        <QueryError error={doses.error} onRetry={() => void doses.refetch()} />
      ) : (
        <View style={{ gap: space.lg }}>
          <Card tone="raised" style={styles.summary}>
            <Ring value={progress} label="hoy" size={92} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="h2">{list.length === 0 ? 'Sin dosis hoy' : `${taken} de ${list.length} dosis`}</Text>
              <Text variant="small" color={colors.muted}>
                {list.length === 0
                  ? 'Agrega tus medicamentos y sus horarios para recibir recordatorios.'
                  : taken === list.length
                    ? 'Todo al día. Buen trabajo.'
                    : 'Marca cada toma para que el modelo conozca tu adherencia.'}
              </Text>
              {adherence.data && adherence.data.last7Rate !== null ? (
                <Text variant="small" color={colors.lime}>
                  Últimos 7 días: {Math.round(adherence.data.last7Rate * 100)}%
                </Text>
              ) : null}
            </View>
          </Card>

          {list.length > 0 ? (
            <Card style={{ paddingTop: space.xl }}>
              {list.map((d, i) => (
                <DoseRow
                  key={`${d.medicationId}-${d.scheduledFor}`}
                  dose={d}
                  isLast={i === list.length - 1}
                  busy={logDose.isPending}
                  onTake={() => apply(d, 'taken')}
                  onSkip={() => apply(d, 'skipped')}
                />
              ))}
            </Card>
          ) : (
            <Card>
              <EmptyState icon="pill" title="Aún no hay medicamentos" body="Agrega el primero para armar tu agenda y activar recordatorios." actionLabel="Agregar medicamento" onAction={() => router.push('/medication-form')} />
            </Card>
          )}

          {(meds.data?.length ?? 0) > 0 ? (
            <View style={{ gap: space.md }}>
              <Text variant="h2">Mis medicamentos</Text>
              {meds.data?.map((m) => (
                <PressableScale key={m.id} onPress={() => router.push({ pathname: '/medication-form', params: { id: m.id } })} accessibilityLabel={`Editar ${m.name}`}>
                  <Card style={styles.medRow}>
                    <View style={styles.medIcon}>
                      <Icon name="pill" size={20} color={colors.brand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="title">{m.name}</Text>
                      <Text variant="small" color={colors.muted}>
                        {[m.dose, m.unit].filter(Boolean).join(' ') || 'Sin dosis'} · {m.scheduleTimes.join(', ') || 'Sin horario'}
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={18} color={colors.faint} />
                  </Card>
                </PressableScale>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  medIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
