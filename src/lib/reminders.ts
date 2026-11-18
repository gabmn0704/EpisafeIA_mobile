import type { Medication } from '@/lib/api/schemas';

export interface DailyReminder {
  /** Estable: permite cancelar y reprogramar sin duplicar. */
  id: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
  medicationId: string;
}

export const REMINDER_PREFIX = 'med-reminder:';

/** Una notificación diaria repetitiva por cada hora de cada medicamento activo. */
export function buildDailyReminders(meds: readonly Medication[]): DailyReminder[] {
  const out: DailyReminder[] = [];
  for (const med of meds) {
    if (!med.active) continue;
    const seen = new Set<string>();
    for (const time of med.scheduleTimes) {
      const m = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (!m || seen.has(time)) continue;
      seen.add(time);
      const dose = [med.dose, med.unit].filter(Boolean).join(' ');
      out.push({
        id: `${REMINDER_PREFIX}${med.id}:${time}`,
        hour: Number(m[1]),
        minute: Number(m[2]),
        title: `Hora de tu ${med.name}`,
        body: dose ? `Toma ${dose} y márcalo en EpiSafe.` : 'Tómalo y márcalo en EpiSafe.',
        medicationId: med.id,
      });
    }
  }
  return out.sort((a, b) => a.hour - b.hour || a.minute - b.minute || a.title.localeCompare(b.title));
}

/** Ids de recordatorios que ya no corresponden a ningún medicamento/hora vigente. */
export function staleReminderIds(scheduledIds: readonly string[], desired: readonly DailyReminder[]): string[] {
  const keep = new Set(desired.map((d) => d.id));
  return scheduledIds.filter((id) => id.startsWith(REMINDER_PREFIX) && !keep.has(id));
}
