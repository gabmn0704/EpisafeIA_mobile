import type { Adherence, DailyLog, Medication, Seizure } from '@/lib/api/schemas';
import { buildReport, escapeHtml, inRange, reportToHtml, reportToText, topTriggers } from './doctorReport';

const sz = (id: string, startedAt: string, over: Partial<Seizure> = {}): Seizure => ({
  id,
  startedAt,
  durationSeconds: 60,
  severity: 3,
  seizureType: null,
  triggersNoted: [],
  location: null,
  notes: null,
  source: 'manual',
  resolvedAt: null,
  ...over,
});
const med: Medication = { id: 'm1', name: 'Valproato', dose: '500', unit: 'mg', scheduleTimes: ['08:00', '20:00'], active: true, notes: null };
const adherence: Adherence = {
  days: 30,
  taken: 9,
  missed: 1,
  skipped: 0,
  total: 10,
  rate: 0.9,
  streakDays: 3,
  last7Rate: 1,
  perMedication: [{ medicationId: 'm1', name: 'Valproato', taken: 9, total: 10, rate: 0.9 }],
};
const log = (logDate: string, sleepHours: number | null, stressLevel: number | null): DailyLog => ({
  logDate,
  sleepHours,
  stressLevel,
  caffeineMg: null,
  exerciseMinutes: null,
  mood: null,
  alcoholUnits: null,
  notes: null,
});

const from = new Date(2026, 9, 1);
const to = new Date(2026, 9, 31);
const d = (day: number, h = 12) => new Date(2026, 9, day, h).toISOString();

describe('doctorReport', () => {
  it('inRange incluye el día final completo', () => {
    expect(inRange(d(31, 23), from, to)).toBe(true);
    expect(inRange(new Date(2026, 10, 1, 0, 0).toISOString(), from, to)).toBe(false);
    expect(inRange(new Date(2026, 8, 30, 23).toISOString(), from, to)).toBe(false);
  });

  it('topTriggers cuenta una vez por crisis y ordena', () => {
    const t = topTriggers([sz('1', d(1), { triggersNoted: ['Estrés', 'Estrés', 'Alcohol'] }), sz('2', d(2), { triggersNoted: ['Estrés'] })]);
    expect(t).toEqual([
      { name: 'Estrés', count: 2 },
      { name: 'Alcohol', count: 1 },
    ]);
  });

  it('buildReport filtra por rango y promedia', () => {
    const r = buildReport({
      patientName: 'Ana',
      from,
      to,
      medications: [med, { ...med, id: 'm2', active: false }],
      adherence,
      seizures: [sz('1', d(5), { durationSeconds: 60, severity: 2 }), sz('2', d(10), { durationSeconds: 120, severity: 4 }), sz('3', new Date(2026, 8, 1).toISOString())],
      logs: [log('2026-10-02', 6, 4), log('2026-10-03', 8, 6), log('2026-09-01', 1, 1)],
    });
    expect(r.totalSeizures).toBe(2);
    expect(r.avgDurationSeconds).toBe(90);
    expect(r.avgSeverity).toBe(3);
    expect(r.avgSleepHours).toBe(7);
    expect(r.avgStress).toBe(5);
    expect(r.medications).toEqual([{ name: 'Valproato', dose: '500 mg', times: '08:00, 20:00', adherencePct: 90 }]);
    expect(r.adherencePct).toBe(90);
  });

  it('sin datos no inventa promedios', () => {
    const r = buildReport({ patientName: 'Ana', from, to, seizures: [], medications: [], adherence: null, logs: [] });
    expect(r.avgSeverity).toBeNull();
    expect(reportToText(r)).toContain('CRISIS: 0');
    expect(reportToText(r)).toContain('Sin datos');
  });

  it('el HTML escapa el contenido del usuario', () => {
    const r = buildReport({ patientName: '<b>Ana</b>', from, to, seizures: [sz('1', d(5), { notes: '<script>x</script>' })], medications: [], adherence: null, logs: [] });
    const html = reportToHtml(r);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(escapeHtml('a&"\'')).toBe('a&amp;&quot;&#39;');
  });
});
