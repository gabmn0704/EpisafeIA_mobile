import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { useContacts, useDeleteContact, useSaveContact } from '@/hooks/queries';
import { friendlyMessage } from '@/lib/api/errors';
import { haptic } from '@/lib/haptics';
import { contactFormSchema, fieldErrors } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

export default function ContactForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const contacts = useContacts();
  const existing = contacts.data?.find((c) => c.id === id);
  const save = useSaveContact();
  const del = useDeleteContact();
  const toast = useToast();

  const [name, setName] = useState(existing?.name ?? '');
  const [relationship, setRelationship] = useState(existing?.relationship ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [priority, setPriority] = useState(existing?.priority ?? (contacts.data?.length ?? 0) + 1);
  const [alertMe, setAlertMe] = useState(existing ? existing.notifySms || existing.notifyEmail : true);
  const [sms, setSms] = useState(existing?.notifySms ?? true);
  const [mail, setMail] = useState(existing?.notifyEmail ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed = contactFormSchema.safeParse({ name, relationship, phone, email });
    if (!parsed.success) {
      haptic.warning();
      return setErrors(fieldErrors(parsed.error));
    }
    setErrors({});
    const v = parsed.data;
    save.mutate(
      {
        id,
        data: {
          name: v.name,
          relationship: v.relationship || null,
          phone: v.phone || null,
          email: v.email || null,
          priority,
          notifySms: alertMe && sms && !!v.phone,
          notifyEmail: alertMe && mail && !!v.email,
        },
      },
      {
        onSuccess: () => {
          toast.success(existing ? 'Contacto actualizado' : 'Contacto agregado');
          router.back();
        },
        onError: (e) => toast.error(friendlyMessage(e)),
      },
    );
  };

  return (
    <Screen glow={colors.coral}>
      <Header title={existing ? 'Editar contacto' : 'Nuevo contacto'} subtitle="Persona de confianza para emergencias" back />
      <View style={{ gap: space.lg }}>
        <Field label="Nombre" value={name} onChangeText={setName} error={errors.name} placeholder="Ej. Mamá" autoCapitalize="words" />
        <Field label="Parentesco (opcional)" value={relationship} onChangeText={setRelationship} placeholder="Madre, pareja, amigo…" />
        <Field label="Teléfono" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" placeholder="+57 300 123 4567" />
        <Field label="Correo (opcional)" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" placeholder="contacto@correo.com" />
        <Card>
          <Stepper label="Prioridad" value={priority} step={1} min={1} max={10} onChange={setPriority} hint="1 recibe el aviso primero" />
        </Card>
        <Card style={{ gap: space.md }}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="title">Avisar en emergencia</Text>
              <Text variant="small" color={colors.muted}>
                {alertMe ? 'Recibirá el aviso automático cuando pulses SOS.' : 'No recibirá aviso automático. Seguirás pudiendo llamarle desde la pantalla de emergencia.'}
              </Text>
            </View>
            <Switch value={alertMe} onValueChange={setAlertMe} trackColor={{ true: colors.lime, false: colors.surface3 }} thumbColor={colors.white} accessibilityLabel="Avisar en emergencia" />
          </View>
          {alertMe ? (
            <View style={styles.row}>
              <Chip label="SMS" selected={sms} onPress={() => setSms((v) => !v)} />
              <Chip label="Correo" selected={mail} onPress={() => setMail((v) => !v)} />
            </View>
          ) : null}
        </Card>
        <Button label={existing ? 'Guardar cambios' : 'Agregar contacto'} onPress={submit} loading={save.isPending} size="lg" />
        {existing ? (
          <Button
            label="Eliminar contacto"
            variant="ghost"
            icon="trash"
            loading={del.isPending}
            onPress={() =>
              del.mutate(existing.id, {
                onSuccess: () => {
                  toast.show({ message: 'Contacto eliminado', tone: 'warning' });
                  router.back();
                },
                onError: (e) => toast.error(friendlyMessage(e)),
              })
            }
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: space.sm }, switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md } });
