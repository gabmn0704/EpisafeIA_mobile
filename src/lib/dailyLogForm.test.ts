import { clamp, DEFAULT_DAILY_FORM, formFromLog, formsEqual, toPayload } from './dailyLogForm';

describe('dailyLogForm', () => {
  it('starts from defaults when there is no log', () => {
    expect(formFromLog(null)).toEqual(DEFAULT_DAILY_FORM);
  });

  it('maps an existing log into the form and back to the payload', () => {
    const form = formFromLog({
      logDate: '2026-11-17',
      sleepHours: 4.5,
      stressLevel: 8,
      caffeineMg: 300,
      exerciseMinutes: null,
      mood: 2,
      alcoholUnits: null,
      notes: '  mala noche ',
    });
    expect(form).toMatchObject({ sleepHours: 4.5, stressLevel: 8, caffeineMg: 300, exerciseMinutes: 0, mood: 2, notes: '  mala noche ' });
    expect(toPayload(form)).toEqual({
      sleepHours: 4.5,
      stressLevel: 8,
      caffeineMg: 300,
      exerciseMinutes: 0,
      mood: 2,
      alcoholUnits: 0,
      notes: 'mala noche',
    });
  });

  it('keeps unanswered scale fields as null and empty notes as null', () => {
    const p = toPayload({ ...DEFAULT_DAILY_FORM });
    expect(p.stressLevel).toBeNull();
    expect(p.mood).toBeNull();
    expect(p.notes).toBeNull();
  });

  it('clamps out-of-range values to what the API accepts', () => {
    const p = toPayload({ ...DEFAULT_DAILY_FORM, sleepHours: 30, caffeineMg: 9999, exerciseMinutes: -5 });
    expect(p).toMatchObject({ sleepHours: 24, caffeineMg: 3000, exerciseMinutes: 0 });
    expect(clamp(5, 1, 3)).toBe(3);
  });

  it('compares forms by value', () => {
    expect(formsEqual(DEFAULT_DAILY_FORM, { ...DEFAULT_DAILY_FORM })).toBe(true);
    expect(formsEqual(DEFAULT_DAILY_FORM, { ...DEFAULT_DAILY_FORM, mood: 3 })).toBe(false);
  });
});
