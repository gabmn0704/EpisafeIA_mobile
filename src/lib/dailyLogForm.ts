import type { DailyLogInput } from '@/lib/api/endpoints';
import type { DailyLog } from '@/lib/api/schemas';

export interface DailyLogForm {
  sleepHours: number;
  stressLevel: number | null;
  caffeineMg: number;
  exerciseMinutes: number;
  mood: number | null;
  alcoholUnits: number;
  notes: string;
}

export const DEFAULT_DAILY_FORM: DailyLogForm = {
  sleepHours: 7,
  stressLevel: null,
  caffeineMg: 0,
  exerciseMinutes: 0,
  mood: null,
  alcoholUnits: 0,
  notes: '',
};

export const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export function formFromLog(log: DailyLog | null | undefined): DailyLogForm {
  if (!log) return { ...DEFAULT_DAILY_FORM };
  return {
    sleepHours: log.sleepHours ?? DEFAULT_DAILY_FORM.sleepHours,
    stressLevel: log.stressLevel,
    caffeineMg: log.caffeineMg ?? 0,
    exerciseMinutes: log.exerciseMinutes ?? 0,
    mood: log.mood,
    alcoholUnits: log.alcoholUnits ?? 0,
    notes: log.notes ?? '',
  };
}

/** Payload para PUT /daily-logs/:date. Los campos vacíos se envían como null (no se inventan datos). */
export function toPayload(form: DailyLogForm): DailyLogInput {
  const notes = form.notes.trim();
  return {
    sleepHours: clamp(form.sleepHours, 0, 24),
    stressLevel: form.stressLevel,
    caffeineMg: Math.round(clamp(form.caffeineMg, 0, 3000)),
    exerciseMinutes: Math.round(clamp(form.exerciseMinutes, 0, 1440)),
    mood: form.mood,
    alcoholUnits: clamp(form.alcoholUnits, 0, 50),
    notes: notes ? notes : null,
  };
}

export function formsEqual(a: DailyLogForm, b: DailyLogForm): boolean {
  return (Object.keys(a) as (keyof DailyLogForm)[]).every((k) => a[k] === b[k]);
}
