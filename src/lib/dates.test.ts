import { formatDateLong, formatDuration, greeting, timeAgo, toDateKey, todayAt } from './dates';

describe('dates', () => {
  it('formats the local date key with zero padding', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 10, 17))).toBe('2026-11-17');
  });

  it('greets according to the hour', () => {
    expect(greeting(new Date(2026, 0, 1, 3))).toBe('Buenas noches');
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Buenos días');
    expect(greeting(new Date(2026, 0, 1, 15))).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 0, 1, 21))).toBe('Buenas noches');
  });

  it('formats relative time', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    expect(timeAgo('2026-11-17T11:59:40Z', now)).toBe('justo ahora');
    expect(timeAgo('2026-11-17T11:30:00Z', now)).toBe('hace 30 min');
    expect(timeAgo('2026-11-17T07:00:00Z', now)).toBe('hace 5 h');
    expect(timeAgo('2026-11-16T05:00:00Z', now)).toBe('hace 1 día');
    expect(timeAgo('2026-11-10T05:00:00Z', now)).toBe('hace 7 días');
  });

  it('formats durations', () => {
    expect(formatDuration(null)).toBe('Sin dato');
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(120)).toBe('2 min');
    expect(formatDuration(150)).toBe('2 min 30 s');
  });

  it('builds today at a given HH:MM and a long date', () => {
    const d = todayAt('08:30', new Date(2026, 10, 17, 22, 5));
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([8, 30, 0]);
    expect(formatDateLong(new Date(2026, 10, 17))).toBe('Martes, 17 de nov');
  });
});
