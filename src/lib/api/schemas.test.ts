import { authResponseSchema, dashboardSchema, scheduleResponseSchema, seizureListSchema } from './schemas';

describe('response schemas', () => {
  it('accepts a dashboard summary with no seizures and no heart rate', () => {
    const parsed = dashboardSchema.safeParse({
      risk: { score: 34, level: 'moderate', factors: [{ name: 'Sueno', impact: 0.4, direction: 'up', detail: '5 h' }], degraded: false },
      adherence: { rate: 0.92, last7Rate: 1, streakDays: 6 },
      lastSeizure: null,
      seizureFreeStreakDays: null,
      currentHeartRate: null,
      activeAlerts: { count: 0, items: [] },
      activeEmergencies: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown risk level', () => {
    const parsed = dashboardSchema.safeParse({
      risk: { score: 1, level: 'extreme', factors: [] },
      adherence: { rate: null, last7Rate: null, streakDays: 0 },
      lastSeizure: null,
      seizureFreeStreakDays: null,
      currentHeartRate: null,
      activeAlerts: { count: 0, items: [] },
      activeEmergencies: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it('parses the daily schedule', () => {
    const parsed = scheduleResponseSchema.parse({
      doses: [
        {
          medicationId: 'm1',
          name: 'Levetiracetam',
          dose: '500',
          unit: 'mg',
          scheduledFor: '2026-11-17T13:00:00.000Z',
          status: 'pending',
          takenAt: null,
          logId: null,
          overdue: false,
        },
      ],
    });
    expect(parsed.doses[0]?.name).toBe('Levetiracetam');
  });

  it('parses auth and paginated seizure payloads', () => {
    expect(
      authResponseSchema.parse({ user: { id: '1', email: 'a@b.co', fullName: 'Ana' }, accessToken: 'x', refreshToken: 'y' }).user.fullName,
    ).toBe('Ana');
    expect(seizureListSchema.parse({ seizures: [], page: 1, limit: 20, total: 0, totalPages: 1 }).total).toBe(0);
  });
});
