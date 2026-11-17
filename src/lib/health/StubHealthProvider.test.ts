import type { HealthProvider } from './HealthProvider';
import { getHealthProvider, StubHealthProvider } from './StubHealthProvider';

describe('StubHealthProvider', () => {
  it('is explicitly marked as not implemented', () => {
    expect(new StubHealthProvider('apple_health').implemented).toBe(false);
  });

  it('reports pending implementation and never returns data', async () => {
    const p: HealthProvider = new StubHealthProvider('google_health');
    expect(await p.isAvailable()).toEqual({ available: false, reason: 'pending_implementation' });
    expect(await p.requestPermissions()).toBe(false);
    expect(await p.readHeartRate(new Date(0), new Date())).toEqual([]);
  });

  it('is what getHealthProvider returns today', () => {
    expect(getHealthProvider().implemented).toBe(false);
  });
});
