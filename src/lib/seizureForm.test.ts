import { clampCustomWhen, customWhenFrom, daysInMonth, formatCustomWhen, groupByMonth, isFuture, monthLabel, severityTone, startedAtFor, startedAtFromCustom, toggleItem } from './seizureForm';

describe('seizureForm', () => {
  const now = new Date('2026-11-17T12:00:00.000Z');

  it('computes the start time for each preset', () => {
    expect(startedAtFor('now', now)).toBe('2026-11-17T12:00:00.000Z');
    expect(startedAtFor('1h', now)).toBe('2026-11-17T11:00:00.000Z');
    expect(startedAtFor('3h', now)).toBe('2026-11-17T09:00:00.000Z');
    expect(startedAtFor('yesterday', now)).toBe('2026-11-16T12:00:00.000Z');
  });

  it('builds the start time of a past seizure from a chosen date and time', () => {
    const when = { year: 2026, month: 3, day: 12, hour: 14, minute: 30 };
    expect(startedAtFromCustom(when)).toBe(new Date(2026, 2, 12, 14, 30).toISOString());
    expect(customWhenFrom(new Date(2025, 0, 5, 8, 15))).toEqual({ year: 2025, month: 1, day: 5, hour: 8, minute: 15 });
  });

  it('knows the days of each month, leap years included', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('clamps an impossible day when the month changes', () => {
    expect(clampCustomWhen({ year: 2026, month: 2, day: 31, hour: 0, minute: 0 }).day).toBe(28);
    expect(startedAtFromCustom({ year: 2026, month: 2, day: 31, hour: 10, minute: 0 })).toBe(new Date(2026, 1, 28, 10, 0).toISOString());
  });

  it('detects dates in the future and formats the chosen date', () => {
    const now = new Date('2026-11-17T12:00:00.000Z');
    expect(isFuture('2026-11-17T12:00:01.000Z', now)).toBe(true);
    expect(isFuture('2026-11-17T11:59:00.000Z', now)).toBe(false);
    expect(formatCustomWhen({ year: 2026, month: 3, day: 5, hour: 9, minute: 5 })).toBe('5 de marzo de 2026, 09:05');
  });

  it('toggles items immutably', () => {
    const base = ['Estrés'] as const;
    expect(toggleItem(base, 'Alcohol')).toEqual(['Estrés', 'Alcohol']);
    expect(toggleItem(base, 'Estrés')).toEqual([]);
    expect(base).toEqual(['Estrés']);
  });

  it('maps severity to a tone', () => {
    expect(severityTone(null)).toBe('unknown');
    expect(severityTone(1)).toBe('low');
    expect(severityTone(3)).toBe('mid');
    expect(severityTone(5)).toBe('high');
  });

  it('groups consecutive seizures by month keeping order', () => {
    const items = [
      { id: 'a', startedAt: '2026-11-10T10:00:00' },
      { id: 'b', startedAt: '2026-11-02T10:00:00' },
      { id: 'c', startedAt: '2026-10-28T10:00:00' },
    ];
    const g = groupByMonth(items);
    expect(g.map((x) => [x.label, x.items.length])).toEqual([
      ['noviembre 2026', 2],
      ['octubre 2026', 1],
    ]);
    expect(monthLabel('2026-01-15T10:00:00')).toBe('enero 2026');
  });
});
