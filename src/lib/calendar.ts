import { toDateKey } from '@/lib/dates';

export interface DayCell {
  key: string;
  day: number;
  inMonth: boolean;
}

export const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Semanas (lunes a domingo) que cubren el mes `month` (0-11), con los días de relleno de los meses vecinos. */
export function monthGrid(year: number, month: number): DayCell[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  const weeks: DayCell[][] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(year, month, 1 - offset + i);
    const cell: DayCell = { key: toDateKey(d), day: d.getDate(), inMonth: d.getMonth() === month };
    if (i % 7 === 0) weeks.push([]);
    (weeks[weeks.length - 1] as DayCell[]).push(cell);
  }
  return weeks;
}

/** Agrupa por día local (YYYY-MM-DD). */
export function groupByDay<T extends { startedAt: string }>(items: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const key = toDateKey(new Date(it.startedAt));
    const list = map.get(key);
    if (list) list.push(it);
    else map.set(key, [it]);
  }
  return map;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
