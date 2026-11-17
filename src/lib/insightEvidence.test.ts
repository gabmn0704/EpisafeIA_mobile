import { formatEvidence, insightKind } from './insightEvidence';

describe('formatEvidence', () => {
  it('returns nothing for missing evidence', () => {
    expect(formatEvidence(undefined)).toEqual([]);
    expect(formatEvidence({})).toEqual([]);
  });

  it('formats n, lift, share, interval and confidence', () => {
    const items = formatEvidence({ n: 12, lift: 2.43, share: 0.8, ci: [0.55, 0.93], confidence: 0.74 });
    expect(items).toEqual([
      { label: 'Casos', value: '12' },
      { label: 'Aumento', value: 'x2.4' },
      { label: 'Proporción', value: '80%' },
      { label: 'Intervalo', value: '55-93%' },
      { label: 'Confianza', value: '74%' },
    ]);
  });

  it('ignores values of the wrong type', () => {
    expect(formatEvidence({ n: 'doce', lift: null, ci: [1] })).toEqual([]);
  });
});

describe('insightKind', () => {
  it('maps known kinds and falls back to a generic one', () => {
    expect(insightKind('sleep_correlation').label).toBe('Sueño');
    expect(insightKind('missed_medication').icon).toBe('pill');
    expect(insightKind('algo-nuevo')).toEqual({ label: 'Patrón', icon: 'chart' });
  });
});
