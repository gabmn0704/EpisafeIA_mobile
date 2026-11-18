import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { keys, useDeleteMedication, useMedications, useSaveMedication } from '@/hooks/queries';
import { useMedSearch } from '@/hooks/useMedSearch';
import { friendlyMessage } from '@/lib/api/errors';
import { haptic } from '@/lib/haptics';
import { askReminderPermission } from '@/lib/notifications';
import { prefs } from '@/lib/prefs';
import { fieldErrors, medicationFormSchema, normalizeTime } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, space } from '@/theme/tokens';

export default function MedicationForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const meds = useMedications();
  const existing = meds.data?.find((m) => m.id === id);
  const search = useMedSearch(meds.data);
  const save = useSaveMedication();
  const del = useDeleteMedication();
  const toast = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState(existing?.name ?? '');
  const [dose, setDose] = useState(existing?.dose ?? '');
  const [unit, setUnit] = useState(existing?.unit ?? 'mg');
  const [times, setTimes] = useState<string[]>(existing?.scheduleTimes ?? []);
  const [timeInput, setTimeInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggest, setShowSuggest] = useState(false);

  const suggestions = showSuggest && name.length >= 1 ? search(name).filter((s) => s.toLowerCase() !== name.trim().toLowerCase()) : [];

  const addTime = () => {
    const t = normalizeTime(timeInput);
    if (!t) {
      haptic.warning();
      return setErrors((e) => ({ ...e, times: 'Escribe la hora como 08:00' }));
    }
    setErrors((e) => ({ ...e, times: '' }));
    setTimes((prev) => (prev.includes(t) ? prev : [...prev, t].sort()));
    setTimeInput('');
  };

  const submit = () => {
    const parsed = medicationFormSchema.safeParse({ name, dose: dose || undefined, unit: unit || undefined, times });
    if (!parsed.success) {
      haptic.warning();
      return setErrors(fieldErrors(parsed.error));
    }
    save.mutate(
      { id, data: { name: parsed.data.name, dose: parsed.data.dose ?? null, unit: parsed.data.unit ?? null, scheduleTimes: parsed.data.times } },
      {
        onSuccess: async () => {
          toast.success(existing ? 'Medicamento actualizado' : 'Medicamento agregado');
          router.back();
          // Primera vez con horarios: se explica y se pide el permiso para los recordatorios.
          if (parsed.data.times.length > 0 && (await prefs.remindersEnabled())) {
            if (await askReminderPermission()) await qc.invalidateQueries({ queryKey: keys.medications });
          }
        },
        onError: (e) => toast.error(friendlyMessage(e)),
      },
    );
  };

  const remove = () => {
    if (!id) return;
    del.mutate(id, {
      onSuccess: () => {
        toast.show({ message: 'Medicamento eliminado', tone: 'warning' });
        router.back();
      },
      onError: (e) => toast.error(friendlyMessage(e)),
    });
  };

  return (
    <Screen glow={colors.brand}>
      <Header title={existing ? 'Editar medicamento' : 'Nuevo medicamento'} subtitle="Define la dosis y a qué horas la tomas" back />
      <View style={{ gap: space.lg }}>
        <View>
          <Field
            label="Nombre"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setShowSuggest(true);
            }}
            error={errors.name}
            placeholder="Escribe el nombre de tu medicamento"
            autoCapitalize="words"
          />
          {suggestions.length > 0 ? (
            <View style={styles.suggest}>
              {suggestions.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onPress={() => {
                    setName(s);
                    setShowSuggest(false);
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.doseRow}>
          <View style={{ flex: 2 }}>
            <Field label="Dosis" value={dose} onChangeText={setDose} keyboardType="decimal-pad" placeholder="500" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Unidad" value={unit} onChangeText={setUnit} placeholder="mg" autoCapitalize="none" />
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <Text variant="label" color={errors.times ? colors.coral : colors.muted}>
            Horarios
          </Text>
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Field label="Hora (24 h)" value={timeInput} onChangeText={setTimeInput} placeholder="08:00" keyboardType="numbers-and-punctuation" onSubmitEditing={addTime} />
            </View>
            <PressableScale onPress={addTime} accessibilityLabel="Agregar hora" style={styles.addTime}>
              <Icon name="plus" size={22} color={colors.limeInk} strokeWidth={2.6} />
            </PressableScale>
          </View>
          {errors.times ? (
            <Text variant="small" color={colors.coral}>
              {errors.times}
            </Text>
          ) : null}
          <View style={styles.times}>
            {times.map((t) => (
              <PressableScale key={t} onPress={() => setTimes((p) => p.filter((x) => x !== t))} accessibilityLabel={`Quitar ${t}`} style={styles.timeChip}>
                <Icon name="clock" size={14} color={colors.lime} />
                <Text variant="small">{t}</Text>
                <Icon name="x" size={14} color={colors.muted} />
              </PressableScale>
            ))}
          </View>
        </View>

        <Text variant="small" color={colors.faint}>
          Los recordatorios se programan en este teléfono y suenan aunque no tengas internet. EpiSafe no recomienda ni ajusta dosis: sigue siempre la indicación de tu neurólogo.
        </Text>

        <Button label={existing ? 'Guardar cambios' : 'Agregar medicamento'} onPress={submit} loading={save.isPending} size="lg" />
        {existing ? <Button label="Eliminar medicamento" onPress={remove} loading={del.isPending} variant="ghost" icon="trash" /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  suggest: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  doseRow: { flexDirection: 'row', gap: space.md },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  addTime: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
});
