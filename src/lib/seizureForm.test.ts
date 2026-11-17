import { groupByMonth, monthLabel, severityTone, startedAtFor, toggleItem } from './seizureForm';

describe('seizureForm', () => {
  const now = new Date('2026-11-17T12:00:00.000Z');

  it('computes the start time for each preset', () => {
    expect(startedAtFor('now', now)).toBe('2026-11-17T12:00:00.000Z');
    expect(startedAtFor('1h', now)).toBe('2026-11-17T11:00:00.000Z');
    expect(startedAtFor('3h', now)).toBe('2026-11-17T09:00:00.000Z');
    expect(startedAtFor('yesterday', now)).toBe('2026-11-16T12:00:00.000Z');
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
