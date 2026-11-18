import { MAX_BATCH, SampleUploader, type SampleInput } from './SampleUploader';

const sample = (n: number): SampleInput => ({ sampledAt: new Date(n * 1000).toISOString(), heartRate: 60 + (n % 40) });

describe('SampleUploader', () => {
  it('sends samples in batches of at most 200', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const up = new SampleUploader({ send, capacity: 1000 });
    for (let i = 0; i < 450; i++) up.add(sample(i));
    const res = await up.flush();
    expect(res).toEqual({ sent: 450, batches: 3, failed: false });
    expect(send.mock.calls.map((c) => c[0].length)).toEqual([200, 200, 50]);
    expect(up.pending).toBe(0);
  });

  it('never exceeds the API batch limit even if configured higher', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const up = new SampleUploader({ send, batchSize: 999 });
    for (let i = 0; i < MAX_BATCH + 1; i++) up.add(sample(i));
    await up.flush();
    expect(send.mock.calls[0]?.[0]).toHaveLength(MAX_BATCH);
  });

  it('keeps the samples when the network fails and retries later', async () => {
    const send = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const up = new SampleUploader({ send });
    up.add(sample(1));
    up.add(sample(2));
    expect((await up.flush()).failed).toBe(true);
    expect(up.pending).toBe(2);
    expect((await up.flush()).sent).toBe(2);
    expect(up.pending).toBe(0);
  });

  it('sends oldest first and counts dropped samples on overflow', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const up = new SampleUploader({ send, capacity: 3 });
    [1, 2, 3, 4, 5].forEach((n) => up.add(sample(n)));
    expect(up.dropped).toBe(2);
    await up.flush();
    expect(send.mock.calls[0]?.[0].map((s: SampleInput) => s.sampledAt)).toEqual([3, 4, 5].map((n) => sample(n).sampledAt));
  });

  it('shares one in-flight flush between concurrent callers', async () => {
    let release: () => void = () => undefined;
    const send = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const up = new SampleUploader({ send });
    up.add(sample(1));
    const a = up.flush();
    const b = up.flush();
    expect(a).toBe(b);
    release();
    await a;
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('flushes periodically while started', async () => {
    jest.useFakeTimers();
    const send = jest.fn().mockResolvedValue(undefined);
    const up = new SampleUploader({ send, intervalMs: 1000 });
    up.start();
    up.start();
    up.add(sample(1));
    await jest.advanceTimersByTimeAsync(1000);
    expect(send).toHaveBeenCalledTimes(1);
    up.stop();
    up.add(sample(2));
    await jest.advanceTimersByTimeAsync(5000);
    expect(send).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
