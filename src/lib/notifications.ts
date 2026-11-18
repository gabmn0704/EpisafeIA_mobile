import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication } from '@/lib/api/schemas';
import { buildDailyReminders, REMINDER_PREFIX, staleReminderIds } from './reminders';

const supported = Platform.OS !== 'web';

let configured = false;
function configure(): void {
  if (configured || !supported) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** Canal Android de recordatorios (alta importancia para que suene y se vea). */
/* eslint-disable import/namespace -- el enum se reexporta con export * y el resolver no lo ve */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Recordatorios de medicación',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#c6ff3d',
    vibrationPattern: [0, 250, 150, 250],
  });
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Alertas de salud',
    importance: Notifications.AndroidImportance.MAX,
    lightColor: '#ff5c78',
    vibrationPattern: [0, 500, 200, 500],
  });
}

/* eslint-enable import/namespace */

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    configure();
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Reconcilia los recordatorios locales con los medicamentos actuales: cancela
 * los que sobran y (re)programa los vigentes. Devuelve cuántos quedaron activos.
 */
export async function syncMedicationReminders(meds: readonly Medication[], enabled = true): Promise<number> {
  if (!supported) return 0;
  try {
    configure();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = scheduled.map((n) => n.identifier);
    const desired = enabled ? buildDailyReminders(meds) : [];

    for (const id of staleReminderIds(scheduledIds, desired)) await Notifications.cancelScheduledNotificationAsync(id);
    if (!desired.length) return 0;
    if (!(await ensureNotificationPermission())) return 0;

    for (const r of desired) {
      // Reprogramar con el mismo identificador reemplaza el anterior.
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, sound: true, data: { medicationId: r.medicationId, kind: 'medication' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute, channelId: 'reminders' },
      });
    }
    return desired.length;
  } catch {
    return 0;
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (!supported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) if (n.identifier.startsWith(REMINDER_PREFIX)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  } catch {
    // nada que cancelar
  }
}

/** Notificación local inmediata (p. ej. alerta del reloj mientras la app está abierta). */
export async function notifyNow(title: string, body: string): Promise<void> {
  if (!supported) return;
  try {
    configure();
    if (!(await ensureNotificationPermission())) return;
    await Notifications.scheduleNotificationAsync({ content: { title, body, sound: true }, trigger: null });
  } catch {
    // las notificaciones son un refuerzo, no deben romper el flujo
  }
}
