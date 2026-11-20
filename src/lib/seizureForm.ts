export type WhenPreset = 'now' | '1h' | '3h' | 'yesterday';

/** Las opciones rápidas más "Otra fecha", que abre el selector de fecha y hora para crisis pasadas. */
export type WhenChoice = WhenPreset | 'custom';

export const WHEN_LABELS: Record<WhenChoice, string> = {
  now: 'Ahora',
  '1h': 'Hace 1 h',
  '3h': 'Hace 3 h',
  yesterday: 'Ayer',
  custom: 'Otra fecha',
};

export const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

/** Fecha y hora elegidas a mano para una crisis pasada (hora local del teléfono; mes de 1 a 12). */
export interface CustomWhen {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function customWhenFrom(date: Date): CustomWhen {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes() };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Corrige el día si el mes o el año elegidos no lo permiten (31 de febrero pasa a 28 o 29). */
export function clampCustomWhen(w: CustomWhen): CustomWhen {
  return { ...w, day: Math.min(w.day, daysInMonth(w.year, w.month)) };
}

export function startedAtFromCustom(w: CustomWhen): string {
  const c = clampCustomWhen(w);
  return new Date(c.year, c.month - 1, c.day, c.hour, c.minute).toISOString();
}

export function isFuture(iso: string, now: Date = new Date()): boolean {
  return Date.parse(iso) > now.getTime();
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "12 de marzo de 2026, 14:30" */
export function formatCustomWhen(w: CustomWhen): string {
  const c = clampCustomWhen(w);
  return `${c.day} de ${MONTH_NAMES[c.month - 1]} de ${c.year}, ${pad2(c.hour)}:${pad2(c.minute)}`;
}

/** Instante de inicio de la crisis según el preset elegido (ayer = mismo instante, 24 h antes). */
export function startedAtFor(preset: WhenPreset, now: Date = new Date()): string {
  const hours: Record<WhenPreset, number> = { now: 0, '1h': 1, '3h': 3, yesterday: 24 };
  return new Date(now.getTime() - hours[preset] * 3_600_000).toISOString();
}

export const SEIZURE_TYPES = ['Tónico-clónica', 'Focal', 'Ausencia', 'Mioclónica', 'Otra'] as const;

export const TRIGGERS = ['Poco sueño', 'Estrés', 'Olvidé medicación', 'Alcohol', 'Fiebre', 'Luces intensas', 'Ayuno'] as const;

export function toggleItem<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Severidad 1-5 a color de la línea de tiempo (verde claro a coral). */
export function severityTone(severity: number | null): 'low' | 'mid' | 'high' | 'unknown' {
  if (severity === null) return 'unknown';
  if (severity <= 2) return 'low';
  if (severity === 3) return 'mid';
  return 'high';
}

/** Agrupa por mes para la línea de tiempo: "noviembre 2026". */
export function monthLabel(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function groupByMonth<T extends { startedAt: string }>(items: readonly T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const it of items) {
    const label = monthLabel(it.startedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }
  return groups;
}
