import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { endpoints } from '@/lib/api/instance';
import { isRetryable } from '@/lib/offlineQueue';
import { notifyNow, snoozeReminder } from '@/lib/notifications';
import { ACTION_SNOOZE, ACTION_TAKEN, doseScheduledFor, parseReminderData } from '@/lib/reminders';
import { useAuth } from '@/providers/AuthProvider';
import { useOfflineQueue } from '@/providers/OfflineQueueProvider';

/**
 * Atiende los botones de la notificación de medicación ("Ya la tomé", "Recordar en 10 min")
 * y abre la pestaña de medicamentos al tocar el aviso. Si no hay red, la toma queda en la cola offline.
 */
export function useReminderActions(): void {
  const { status } = useAuth();
  const { enqueue } = useOfflineQueue();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS === 'web' || status !== 'signedIn') return;

    const handle = async (response: Notifications.NotificationResponse) => {
      const { request, date } = response.notification;
      const key = `${request.identifier}|${date}|${response.actionIdentifier}`;
      if (handled.current.has(key)) return;
      const data = parseReminderData(request.content.data);
      if (!data) return;
      handled.current.add(key);

      if (response.actionIdentifier === ACTION_SNOOZE) {
        await snoozeReminder(request.content.title ?? 'Hora de tu medicación', request.content.body ?? '', request.content.data ?? {});
      } else if (response.actionIdentifier === ACTION_TAKEN) {
        const payload = { medicationId: data.medicationId, scheduledFor: doseScheduledFor(data.hour, data.minute), status: 'taken' as const };
        try {
          await endpoints.medications.logDose(payload.medicationId, payload.scheduledFor, payload.status);
          await notifyNow('Toma registrada', 'Anotamos que ya tomaste tu medicamento.');
        } catch (e) {
          if (isRetryable(e)) {
            await enqueue({ kind: 'dose', payload });
            await notifyNow('Toma guardada', 'Sin conexión: la enviaremos en cuanto haya red.');
          }
        }
      } else {
        router.push('/medications');
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener((r) => void handle(r));
    // Arranque en frío: la app se abrió desde un botón o toque de la notificación.
    void Notifications.getLastNotificationResponseAsync().then((r) => r && handle(r));
    return () => sub.remove();
  }, [status, enqueue]);
}
