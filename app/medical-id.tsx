import { useEffect, useMemo, useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useContacts, useMedications } from '@/hooks/queries';
import { telUrl } from '@/lib/emergencyMachine';
import { BLOOD_TYPES, buildSnapshot, EMPTY_PROFILE, isProfileEmpty, medicalIdText, type MedicalProfile, type MedicalSnapshot } from '@/lib/medicalId';
import { prefs } from '@/lib/prefs';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

/**
 * Ficha médica de emergencia. Es accesible sin desbloquear la app para que un tercero pueda ayudar.
 * Alergias y otros datos se guardan solo en el teléfono; medicación y contactos se copian del API
 * la última vez que hubo conexión, para poder verlos sin red.
 */
export default function MedicalId() {
  const { user } = useAuth();
  const toast = useToast();
  const meds = useMedications();
  const contacts = useContacts();
  const [profile, setProfile] = useState<MedicalProfile>(EMPTY_PROFILE);
  const [stored, setStored] = useState<MedicalSnapshot | null>(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([prefs.getMedicalProfile(), prefs.getMedicalSnapshot()]).then(([p, s]) => {
      setProfile(p);
      setStored(s);
      setLoaded(true);
    });
  }, []);

  // Con conexión se refresca la copia local de medicación y contactos.
  const fresh = useMemo(() => (meds.data && contacts.data ? buildSnapshot(meds.data, contacts.data) : null), [meds.data, contacts.data]);
  const snapshot = fresh ?? stored;
  useEffect(() => {
    if (fresh) void prefs.setMedicalSnapshot(fresh);
  }, [fresh]);

  const name = user?.fullName ?? 'Paciente';

  const save = async () => {
    await prefs.setMedicalProfile(profile);
    setEditing(false);
    toast.success('Ficha guardada en tu teléfono.');
  };

  const share = () => void Share.share({ message: medicalIdText(name, profile, snapshot) }).catch(() => undefined);
  const call = (phone: string) => Linking.openURL(telUrl(phone)).catch(() => toast.error('No se pudo abrir el marcador del teléfono.'));

  return (
    <Screen glow={colors.coral}>
      <Header title="Ficha médica" subtitle="Para quien te ayude en una emergencia" back />

      <Card tone="raised" style={{ gap: space.sm, borderColor: colors.coral, borderWidth: 2 }}>
        <Text variant="h1">{name}</Text>
        <Text variant="title" color={colors.coral}>
          Tiene epilepsia
        </Text>
        <Text variant="body" color={colors.muted}>
          Si convulsiona: mantén la calma, aparta objetos, ponla de lado, no le metas nada en la boca y cuenta el tiempo. Llama a emergencias si dura más de 5 minutos.
        </Text>
      </Card>

      {editing ? (
        <View style={{ gap: space.lg, marginTop: space.lg }}>
          <Card style={{ gap: space.md }}>
            <Text variant="label" color={colors.muted}>
              Grupo sanguíneo
            </Text>
            <View style={styles.wrap}>
              {BLOOD_TYPES.map((b) => (
                <Chip key={b} label={b} selected={profile.bloodType === b} onPress={() => setProfile((p) => ({ ...p, bloodType: p.bloodType === b ? '' : b }))} />
              ))}
            </View>
          </Card>
          <Field label="Alergias" value={profile.allergies} onChangeText={(t) => setProfile((p) => ({ ...p, allergies: t }))} placeholder="Ej: penicilina, látex" multiline maxLength={500} style={styles.area} />
          <Field label="Otras condiciones" value={profile.conditions} onChangeText={(t) => setProfile((p) => ({ ...p, conditions: t }))} placeholder="Ej: diabetes, asma" multiline maxLength={500} style={styles.area} />
          <Field label="Indicaciones para quien te ayude" value={profile.notes} onChangeText={(t) => setProfile((p) => ({ ...p, notes: t }))} placeholder="Ej: tomo medicación a las 8 y 20 h" multiline maxLength={800} style={styles.area} />
          <Button label="Guardar ficha" onPress={() => void save()} size="lg" />
          <Button label="Cancelar" variant="ghost" onPress={() => setEditing(false)} />
        </View>
      ) : (
        <View style={{ gap: space.lg, marginTop: space.lg }}>
          <Info label="Grupo sanguíneo" value={profile.bloodType || 'No registrado'} />
          <Info label="Alergias" value={profile.allergies || 'No registradas'} danger={!!profile.allergies} />
          {profile.conditions ? <Info label="Otras condiciones" value={profile.conditions} /> : null}
          <Info
            label="Medicación"
            value={snapshot && snapshot.medications.length > 0 ? snapshot.medications.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ''}`).join('\n') : 'No registrada'}
          />
          {profile.notes ? <Info label="Indicaciones" value={profile.notes} /> : null}

          <Text variant="label" color={colors.muted}>
            Contactos de emergencia
          </Text>
          {snapshot && snapshot.contacts.length > 0 ? (
            snapshot.contacts.map((c) => (
              <Button key={c.phone + c.name} label={`Llamar a ${c.name}${c.relationship ? ` (${c.relationship})` : ''}`} icon="phone" size="lg" onPress={() => call(c.phone)} accessibilityHint={`Marca ${c.phone}`} />
            ))
          ) : (
            <Text variant="body" color={colors.muted}>
              {loaded ? 'Sin contactos guardados. Agrégalos en Más > Contactos de emergencia.' : ' '}
            </Text>
          )}

          {loaded && isProfileEmpty(profile) ? (
            <Text variant="body" color={colors.amber}>
              Completa tu ficha: alergias y grupo sanguíneo ayudan mucho en una emergencia.
            </Text>
          ) : null}
          <Button label="Editar mi ficha" icon="edit" variant="soft" onPress={() => setEditing(true)} />
          <Button label="Compartir como texto" icon="users" variant="ghost" onPress={share} />
          {snapshot?.savedAt ? (
            <Text variant="small" color={colors.faint} center>
              Medicación y contactos actualizados: {new Date(snapshot.savedAt).toLocaleString('es')}
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function Info({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card style={{ gap: 4 }}>
      <Text variant="label" color={colors.muted}>
        {label}
      </Text>
      <Text variant="h2" color={danger ? colors.coral : colors.ink}>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  area: { height: 96, paddingTop: 14, textAlignVertical: 'top' },
});
