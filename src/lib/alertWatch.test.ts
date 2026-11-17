import { alertTitle, pickNewAlerts, type AlertLike } from './alertWatch';

const a = (id: string, extra: Partial<AlertLike> = {}): AlertLike => ({ id, kind: 'tachycardia', detectedAt: '2026-11-17T10:00:00Z', ...extra });

describe('pickNewAlerts', () => {
  it('marks everything as seen on the first load without notifying', () => {
    const r = pickNewAlerts(null, [a('1'), a('2')]);
    expect(r.fresh).toEqual([]);
    expect([...r.seen]).toEqual(['1', '2']);
  });

  it('returns only alerts not seen before', () => {
    const first = pickNewAlerts(null, [a('1')]);
    const second = pickNewAlerts(first.seen, [a('1'), a('2')]);
    expect(second.fresh.map((x) => x.id)).toEqual(['2']);
    expect(pickNewAlerts(second.seen, [a('1'), a('2')]).fresh).toEqual([]);
  });

  it('skips alerts that were already escalated to an emergency', () => {
    const r = pickNewAlerts(new Set(), [a('9', { convertedEventId: 'ev' })]);
    expect(r.fresh).toEqual([]);
  });
});

describe('alertTitle', () => {
  it('has Spanish copy per kind and a fallback', () => {
    expect(alertTitle('fall')).toBe('Posible caída detectada');
    expect(alertTitle('otra')).toBe('Alerta de salud');
  });
});
