import { useEffect } from 'react';
import { useMedications } from '@/hooks/queries';
import { syncMedicationReminders } from '@/lib/notifications';
import { prefs } from '@/lib/prefs';

/** Mantiene las notificaciones locales de medicación alineadas con los datos del servidor. */
export function useReminderSync(): void {
  const { data } = useMedications();
  useEffect(() => {
    if (!data) return;
    let alive = true;
    prefs.remindersEnabled().then((enabled) => {
      if (alive) void syncMedicationReminders(data, enabled);
    });
    return () => {
      alive = false;
    };
  }, [data]);
}
