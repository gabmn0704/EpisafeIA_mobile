import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { BottomSheet, useSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useMedications } from '@/hooks/queries';
import { API_URL } from '@/lib/config';
import { askReminderPermission, cancelAllReminders, syncMedicationReminders } from '@/lib/notifications';
import { prefs } from '@/lib/prefs';
import { useAppLock } from '@/providers/AppLockProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

export default function Settings() {
  const { user, signOut } = useAuth();
  const logoutSheet = useSheet();
  const meds = useMedications();
  const toast = useToast();
  const lock = useAppLock();
  const [reminders, setReminders] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    prefs.remindersEnabled().then(setReminders);
  }, []);

  const toggleReminders = async (on: boolean) => {
    setReminders(on);
    await prefs.setRemindersEnabled(on);
    if (!on) {
      await cancelAllReminders();
      return toast.show('Recordatorios desactivados');
    }
    const granted = await askReminderPermission();
    if (!granted) {
      toast.show({ message: 'Activa las notificaciones de EpiSafe en los ajustes del teléfono.', tone: 'warning', durationMs: 5000 });
      return;
    }
    const n = await syncMedicationReminders(meds.data ?? [], true);
    toast.success(n > 0 ? `${n} recordatorios programados` : 'Recordatorios activados');
  };

  const toggleLock = async (on: boolean) => {
    const r = await lock.setEnabled(on);
    if (r === 'unavailable') toast.show({ message: 'Configura una huella, rostro o PIN en tu teléfono para poder usar el bloqueo.', tone: 'warning', durationMs: 5000 });
    else if (r === 'failed') toast.show({ message: 'No se pudo confirmar tu identidad. El bloqueo sigue desactivado.', tone: 'warning' });
    else toast.success(on ? 'Bloqueo activado. La emergencia y la ficha médica siguen abiertas.' : 'Bloqueo desactivado');
  };

  return (
    <Screen glow={colors.brand}>
      <Header title="Perfil y ajustes" back />

      <Card tone="raised" style={{ gap: 4 }}>
        <Text variant="h2">{user?.fullName}</Text>
        <Text variant="small" color={colors.muted}>
          {user?.email}
        </Text>
        {user?.timezone ? (
          <Text variant="small" color={colors.faint}>
            Zona horaria: {user.timezone}
          </Text>
        ) : null}
      </Card>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        <Card style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text variant="title">Recordatorios de medicación</Text>
            <Text variant="small" color={colors.muted}>
              Notificaciones locales a la hora de cada dosis. Funcionan sin internet.
            </Text>
          </View>
          <Switch value={reminders} onValueChange={toggleReminders} trackColor={{ true: colors.lime, false: colors.surface3 }} thumbColor={colors.white} accessibilityLabel="Recordatorios de medicación" />
        </Card>

        <Card style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text variant="title">Bloqueo de la app</Text>
            <Text variant="small" color={colors.muted}>
              Pide tu huella, rostro o PIN al abrir. La pantalla de emergencia y la ficha médica se pueden abrir sin desbloquear, para que alguien te ayude.
            </Text>
          </View>
          <Switch value={lock.enabled} onValueChange={toggleLock} trackColor={{ true: colors.lime, false: colors.surface3 }} thumbColor={colors.white} accessibilityLabel="Bloqueo de la app con huella, rostro o PIN" />
        </Card>

        <Card style={{ gap: 6 }}>
          <Text variant="title">Privacidad</Text>
          <Text variant="small" color={colors.muted}>
            Tu sesión se guarda en el almacén seguro del teléfono (Keychain / Keystore). La ubicación solo se usa cuando activas una emergencia.
          </Text>
        </Card>

        <Card tone="outline" style={{ gap: 4 }}>
          <Text variant="label" color={colors.muted}>
            Conexión
          </Text>
          <Text variant="small" color={colors.faint} selectable>
            API: {API_URL}
          </Text>
          <Text variant="small" color={colors.faint}>
            Versión {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </Card>

        <Text variant="small" color={colors.faint} center>
          EpiSafe IA es una herramienta de apoyo y no reemplaza la atención médica. Ante una crisis prolongada llama a emergencias.
        </Text>

        <Button label="Cerrar sesión" variant="ghost" icon="logout" onPress={logoutSheet.show} />
        <BottomSheet visible={logoutSheet.open} onClose={logoutSheet.hide} title="¿Cerrar sesión?" subtitle="Dejarás de recibir recordatorios de medicación en este teléfono hasta que vuelvas a entrar.">
          <View style={{ gap: space.md }}>
            <Button
              label="Cerrar sesión"
              variant="danger"
              icon="logout"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                await cancelAllReminders();
                await signOut();
              }}
            />
            <Button label="Mejor me quedo" variant="soft" onPress={logoutSheet.hide} />
          </View>
        </BottomSheet>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: space.md } });
