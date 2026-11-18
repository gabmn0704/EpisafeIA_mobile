import { ToastQueue, type Toast } from './toastQueue';

describe('ToastQueue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = () => {
    const seen: (string | null)[] = [];
    const q = new ToastQueue((t: Toast | null) => seen.push(t?.message ?? null));
    return { q, seen };
  };

  it('shows the first toast immediately and queues the rest in order', () => {
    const { q, seen } = setup();
    q.show({ message: 'uno' });
    q.show({ message: 'dos' });
    q.show({ message: 'tres' });
    expect(seen).toEqual(['uno']);
    expect(q.pending).toBe(2);
  });

  it('advances automatically after the duration', () => {
    const { q, seen } = setup();
    q.show({ message: 'uno', durationMs: 1000 });
    q.show({ message: 'dos', durationMs: 1000 });
    jest.advanceTimersByTime(1000);
    expect(seen).toEqual(['uno', 'dos']);
    jest.advanceTimersByTime(1000);
    expect(seen).toEqual(['uno', 'dos', null]);
  });

  it('dismiss moves on to the next one and cancels the old timer', () => {
    const { q, seen } = setup();
    q.show({ message: 'a', durationMs: 1000 });
    q.show({ message: 'b', durationMs: 5000 });
    q.dismiss();
    jest.advanceTimersByTime(1000); // el timer de "a" no debe cerrar "b"
    expect(seen).toEqual(['a', 'b']);
  });

  it('clear drops everything', () => {
    const { q, seen } = setup();
    q.show({ message: 'a' });
    q.show({ message: 'b' });
    q.clear();
    expect(seen[seen.length - 1]).toBeNull();
    expect(q.pending).toBe(0);
  });

  it('applies defaults and keeps actions', () => {
    let got: Toast | null = null;
    const q = new ToastQueue((t) => {
      got = t;
    });
    q.show({ message: 'x', actionLabel: 'Deshacer', tone: 'success' });
    expect(got).toMatchObject({ tone: 'success', durationMs: 3500, actionLabel: 'Deshacer' });
  });
});
