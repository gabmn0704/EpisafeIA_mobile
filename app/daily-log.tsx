import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScaleSelector } from '@/components/ui/ScaleSelector';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { useDailyLog, useSaveDailyLog } from '@/hooks/queries';
import { friendlyMessage } from '@/lib/api/errors';
import { toDateKey } from '@/lib/dates';
import { formFromLog, toPayload, type DailyLogForm } from '@/lib/dailyLogForm';
import { haptic } from '@/lib/haptics';
import { Stack } from '@/lib/structures';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

const MOODS = ['Muy mal', 'Mal', 'Normal', 'Bien', 'Muy bien'];
const warm = (r: number) => (r < 0.4 ? colors.ok : r < 0.7 ? colors.amber : colors.coral);

export default function DailyLog() {
  const date = toDateKey();
  const existing = useDailyLog(date);
  if (existing.isLoading) {
    return (
      <Screen glow={colors.cyan}>
        <Header title="Registro de hoy" back />
        <Skeleton height={220} rounded={22} />
      </Screen>
    );
  }
  // El editor se monta con el registro ya cargado: no hace falta sincronizar con efectos.
  return <DailyLogEditor date={date} initial={formFromLog(existing.data)} />;
}

function DailyLogEditor({ date, initial }: { date: string; initial: DailyLogForm }) {
  const save = useSaveDailyLog();
  const toast = useToast();
  const [form, setForm] = useState<DailyLogForm>(initial);
  // Pila de estados previos: cada cambio apila el anterior, "Deshacer" lo recupera (LIFO).
  const history = useRef(new Stack<DailyLogForm>(30));
  const [undoCount, setUndoCount] = useState(0);

  const change = (patch: Partial<DailyLogForm>) => {
    history.current.push(form);
    setUndoCount(history.current.size);
    setForm({ ...form, ...patch });
  };

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    haptic.select();
    setForm(prev);
    setUndoCount(history.current.size);
  };

  const submit = () => {
    save.mutate(
      { date, data: toPayload(form) },
      {
        onSuccess: () => {
          toast.success('Registro guardado. Actualizamos tu riesgo.');
          router.back();
        },
        onError: (e) => toast.error(friendlyMessage(e)),
      },
    );
  };

  return (
    <Screen glow={colors.cyan}>
      <Header
        title="Registro de hoy"
        subtitle="Dos minutos que mejoran tus predicciones"
        back
        right={
          <PressableScale onPress={undo} disabled={undoCount === 0} accessibilityLabel="Deshacer último cambio" style={[styles.undo, undoCount === 0 ? { opacity: 0.35 } : null]}>
            <Icon name="undo" size={18} />
            {undoCount > 0 ? (
              <Text variant="label" color={colors.lime}>
                {undoCount}
              </Text>
            ) : null}
          </PressableScale>
        }
      />
      <View style={{ gap: space.lg }}>
        <Card style={{ gap: space.xl }}>
          <Stepper label="Horas de sueño" value={form.sleepHours} step={0.5} min={0} max={16} unit="h" onChange={(v) => change({ sleepHours: v })} hint={form.sleepHours < 5 ? 'Dormir poco puede subir tu riesgo' : undefined} />
          <ScaleSelector label="Estrés" value={form.stressLevel} min={1} max={10} onChange={(v) => change({ stressLevel: v })} lowLabel="Calma" highLabel="Muy alto" tone={warm} />
        </Card>
        <Card style={{ gap: space.xl }}>
          <Stepper label="Cafeína" value={form.caffeineMg} step={50} min={0} max={1000} unit="mg" onChange={(v) => change({ caffeineMg: v })} hint="Un café ronda los 80-100 mg" />
          <Stepper label="Ejercicio" value={form.exerciseMinutes} step={10} min={0} max={300} unit="min" onChange={(v) => change({ exerciseMinutes: v })} />
          <Stepper label="Alcohol" value={form.alcoholUnits} step={0.5} min={0} max={20} unit="unid." onChange={(v) => change({ alcoholUnits: v })} />
        </Card>
        <Card style={{ gap: space.md }}>
          <ScaleSelector label="Ánimo" value={form.mood} min={1} max={5} onChange={(v) => change({ mood: v })} lowLabel={MOODS[0]} highLabel={MOODS[4]} />
          {form.mood ? (
            <Text variant="small" color={colors.muted}>
              Hoy: {MOODS[form.mood - 1]}
            </Text>
          ) : null}
        </Card>
        <Field label="Notas (opcional)" value={form.notes} onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))} multiline numberOfLines={3} style={{ height: 96, paddingTop: 14, textAlignVertical: 'top' }} placeholder="Algo que quieras recordar de hoy" />
        <Button label="Guardar registro" onPress={submit} loading={save.isPending} size="lg" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  undo: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: colors.surface2 },
});
