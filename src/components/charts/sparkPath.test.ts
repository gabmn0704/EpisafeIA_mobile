import { buildSparkPath } from './sparkPath';

describe('buildSparkPath', () => {
  it('returns empty geometry for an empty series', () => {
    expect(buildSparkPath([], 100, 40)).toEqual({ line: '', area: '', last: null });
  });

  it('maps min to the bottom and max to the top', () => {
    const g = buildSparkPath([0, 10], 100, 40, { pad: 0 });
    expect(g.line.startsWith('M0,40')).toBe(true);
    expect(g.last).toEqual({ x: 100, y: 0 });
  });

  it('centers a single point and survives flat series', () => {
    expect(buildSparkPath([5], 100, 40, { pad: 0 }).last?.x).toBe(50);
    const flat = buildSparkPath([3, 3, 3], 100, 40);
    expect(flat.line).not.toContain('NaN');
  });

  it('clamps values to the provided scale', () => {
    const g = buildSparkPath([500], 100, 40, { min: 0, max: 100, pad: 0 });
    expect(g.last?.y).toBe(0);
  });

  it('closes the area down to the baseline', () => {
    const g = buildSparkPath([1, 2, 3], 120, 50);
    expect(g.area.endsWith('Z')).toBe(true);
    expect(g.area).toContain('L116,50');
  });
});
