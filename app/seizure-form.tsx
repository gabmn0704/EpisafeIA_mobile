import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Header } from '@/components/ui/Header';
import { ScaleSelector } from '@/components/ui/ScaleSelector';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { useCreateSeizure } from '@/hooks/queries';
import { ApiError, friendlyMessage } from '@/lib/api/errors';
import { SEIZURE_TYPES, startedAtFor, toggleItem, TRIGGERS, WHEN_LABELS, type WhenPreset } from '@/lib/seizureForm';
import { useOfflineQueue } from '@/providers/OfflineQueueProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

export default function SeizureForm() {
  const create = useCreateSeizure();
  const toast = useToast();
  const offline = useOfflineQueue();
  const [when, setWhen] = useState<WhenPreset>('now');
  const [minutes, setMinutes] = useState(1);
  const [severity, setSeverity] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const submit = () => {
    const payload = {
      startedAt: startedAtFor(when),
      durationSeconds: Math.round(minutes * 60),
      severity,
      seizureType: type,
      triggersNoted: triggers,
      notes: notes.trim() || null,
    };
    create.mutate(
      payload,
      {
        onSuccess: () => {
          toast.success('Crisis registrada. Recalculamos tu riesgo.');
          router.back();
        },
        onError: async (e) => {
          if (e instanceof ApiError && e.isNetwork) {
            await offline.enqueue({ kind: 'seizure', payload });
            toast.show({ message: 'Sin conexión. Guardamos la crisis en tu teléfono y se enviará sola.', tone: 'warning', durationMs: 5000 });
            router.back();
            return;
          }
          toast.error(friendlyMessage(e));
        },
      },
    );
  };

  return (
    <Screen glow={colors.coral}>
      <Header title="Registrar crisis" subtitle="Anótala cuando te sientas mejor" back />
      <View style={{ gap: space.lg }}>
        <Card style={{ gap: space.md }}>
          <Text variant="label" color={colors.muted}>
            ¿Cuándo ocurrió?
          </Text>
          <View style={styles.wrap}>
            {(Object.keys(WHEN_LABELS) as WhenPreset[]).map((k) => (
              <Chip key={k} label={WHEN_LABELS[k]} selected={when === k} onPress={() => setWhen(k)} />
            ))}
          </View>
        </Card>
        <Card style={{ gap: space.xl }}>
          <Stepper label="Duración" value={minutes} step={0.5} min={0} max={30} unit="min" onChange={setMinutes} />
          <ScaleSelector label="Severidad" value={severity} min={1} max={5} onChange={setSeverity} lowLabel="Leve" highLabel="Muy fuerte" tone={(r) => (r < 0.5 ? colors.amber : colors.coral)} />
        </Card>
        <Card style={{ gap: space.md }}>
          <Text variant="label" color={colors.muted}>
            Tipo
          </Text>
          <View style={styles.wrap}>
            {SEIZURE_TYPES.map((t) => (
              <Chip key={t} label={t} selected={type === t} onPress={() => setType(type === t ? null : t)} />
            ))}
          </View>
        </Card>
        <Card style={{ gap: space.md }}>
          <Text variant="label" color={colors.muted}>
            Posibles desencadenantes
          </Text>
          <View style={styles.wrap}>
            {TRIGGERS.map((t) => (
              <Chip key={t} label={t} selected={triggers.includes(t)} onPress={() => setTriggers((p) => toggleItem(p, t))} tone={colors.amber} />
            ))}
          </View>
        </Card>
        <Field label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline style={{ height: 96, paddingTop: 14, textAlignVertical: 'top' }} placeholder="Qué pasó antes, cómo te sentiste después" />
        <Button label="Guardar crisis" onPress={submit} loading={create.isPending} size="lg" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm } });
