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

export const REMINDER_CATEGORY = 'med-reminder';
export const ACTION_TAKEN = 'taken';
export const ACTION_SNOOZE = 'snooze';
export const SNOOZE_MINUTES = 10;

export interface ReminderData {
  kind: 'medication';
  medicationId: string;
  hour: number;
  minute: number;
}

/** Valida los datos que viajan dentro de la notificación (llegan como unknown). */
export function parseReminderData(data: unknown): ReminderData | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.kind !== 'medication' || typeof d.medicationId !== 'string') return null;
  if (typeof d.hour !== 'number' || typeof d.minute !== 'number') return null;
  return { kind: 'medication', medicationId: d.medicationId, hour: d.hour, minute: d.minute };
}

/** Instante ISO de la dosis de hoy a esa hora local: identifica la toma que se confirma. */
export function doseScheduledFor(hour: number, minute: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
