import type { Medication } from '@/lib/api/schemas';
import { buildDailyReminders, doseScheduledFor, parseReminderData, REMINDER_PREFIX, staleReminderIds } from './reminders';

const med = (over: Partial<Medication>): Medication => ({
  id: 'm1',
  name: 'Lamotrigina',
  dose: '100',
  unit: 'mg',
  scheduleTimes: ['08:00', '20:30'],
  active: true,
  notes: null,
  ...over,
});

describe('buildDailyReminders', () => {
  it('creates one reminder per time with stable ids and dose in the body', () => {
    const r = buildDailyReminders([med({})]);
    expect(r.map((x) => x.id)).toEqual([`${REMINDER_PREFIX}m1:08:00`, `${REMINDER_PREFIX}m1:20:30`]);
    expect(r[0]).toMatchObject({ hour: 8, minute: 0, title: 'Hora de tu Lamotrigina' });
    expect(r[0]?.body).toContain('100 mg');
  });

  it('skips inactive medications, invalid times and duplicates', () => {
    expect(buildDailyReminders([med({ active: false })])).toEqual([]);
    expect(buildDailyReminders([med({ scheduleTimes: ['25:00', '8:00', '09:00', '09:00'] })])).toHaveLength(1);
  });

  it('sorts across medications by time', () => {
    const r = buildDailyReminders([med({ id: 'a', scheduleTimes: ['21:00'] }), med({ id: 'b', name: 'Levetiracetam', scheduleTimes: ['07:15'] })]);
    expect(r.map((x) => x.medicationId)).toEqual(['b', 'a']);
  });

  it('uses a neutral body when there is no dose', () => {
    expect(buildDailyReminders([med({ dose: null, unit: null })])[0]?.body).toBe('Tómalo y márcalo en EpiSafe.');
  });
});

describe('staleReminderIds', () => {
  it('returns only our own reminders that are no longer desired', () => {
    const desired = buildDailyReminders([med({ scheduleTimes: ['08:00'] })]);
    const scheduled = [`${REMINDER_PREFIX}m1:08:00`, `${REMINDER_PREFIX}m1:20:30`, 'otra-app:1'];
    expect(staleReminderIds(scheduled, desired)).toEqual([`${REMINDER_PREFIX}m1:20:30`]);
  });
});

describe('parseReminderData', () => {
  it('acepta datos válidos y rechaza el resto', () => {
    expect(parseReminderData({ kind: 'medication', medicationId: 'm1', hour: 8, minute: 30 })).toEqual({ kind: 'medication', medicationId: 'm1', hour: 8, minute: 30 });
    expect(parseReminderData({ kind: 'otra' })).toBeNull();
    expect(parseReminderData(null)).toBeNull();
    expect(parseReminderData({ kind: 'medication', medicationId: 'm1', hour: '8', minute: 0 })).toBeNull();
  });
});

describe('doseScheduledFor', () => {
  it('fija la hora local del día indicado', () => {
    const d = new Date(doseScheduledFor(8, 30, new Date(2026, 10, 18, 15, 0)));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([2026, 10, 18, 8, 30, 0]);
  });
});
