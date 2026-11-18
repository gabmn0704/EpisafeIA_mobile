import { runWake } from './wake';

function clock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
  };
}

describe('runWake', () => {
  it('returns true as soon as the server answers', async () => {
    let calls = 0;
    const ok = await runWake({ ping: async () => ++calls >= 3, ...clock() });
    expect(ok).toBe(true);
    expect(calls).toBe(3);
  });

  it('gives up after maxMs and reports ticks', async () => {
    const ticks: number[] = [];
    const ok = await runWake({ ping: async () => false, maxMs: 10_000, intervalMs: 3_000, ...clock(), onTick: (i) => ticks.push(i.attempt) });
    expect(ok).toBe(false);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });

  it('treats a throwing ping as not ready', async () => {
    const ok = await runWake({
      ping: async () => {
        throw new Error('x');
      },
      maxMs: 3_000,
      intervalMs: 3_000,
      ...clock(),
    });
    expect(ok).toBe(false);
  });
});
