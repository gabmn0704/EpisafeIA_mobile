export type WhenPreset = 'now' | '1h' | '3h' | 'yesterday';

export const WHEN_LABELS: Record<WhenPreset, string> = {
  now: 'Ahora',
  '1h': 'Hace 1 h',
  '3h': 'Hace 3 h',
  yesterday: 'Ayer',
};

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
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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
