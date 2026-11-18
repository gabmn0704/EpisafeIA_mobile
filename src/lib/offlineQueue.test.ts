import { ApiError } from '@/lib/api/errors';
import { isRetryable, OfflineQueue, type KeyValueStore, type PendingItem } from './offlineQueue';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
  };
}

const seizure = { kind: 'seizure' as const, payload: { startedAt: '2026-11-01T10:00:00.000Z', severity: 3 } };
const net = () => new ApiError(0, 'NETWORK_ERROR', 'sin red');

describe('OfflineQueue', () => {
  it('persiste y recarga los pendientes', async () => {
    const store = memoryStore();
    const q = new OfflineQueue('k', store);
    await q.enqueue(seizure);
    const again = new OfflineQueue('k', store);
    expect(await again.load()).toBe(1);
    expect(again.list()[0]?.kind).toBe('seizure');
  });

  it('reemplaza el registro diario pendiente de la misma fecha', async () => {
    const q = new OfflineQueue('k', memoryStore());
    await q.enqueue({ kind: 'dailyLog', date: '2026-11-01', payload: { sleepHours: 5 } });
    await q.enqueue({ kind: 'dailyLog', date: '2026-11-01', payload: { sleepHours: 7 } });
    await q.enqueue({ kind: 'dailyLog', date: '2026-11-02', payload: { sleepHours: 6 } });
    expect(q.count).toBe(2);
    expect((q.list()[0] as Extract<PendingItem, { kind: 'dailyLog' }>).payload.sleepHours).toBe(7);
  });

  it('envía en orden y vacía la cola', async () => {
    const q = new OfflineQueue('k', memoryStore());
    await q.enqueue(seizure);
    await q.enqueue({ kind: 'dailyLog', date: '2026-11-01', payload: {} });
    const order: string[] = [];
    const res = await q.flush(async (i) => void order.push(i.kind));
    expect(order).toEqual(['seizure', 'dailyLog']);
    expect(res).toEqual({ sent: 2, dropped: 0, remaining: 0 });
  });

  it('se detiene ante un fallo de red y conserva los pendientes', async () => {
    const q = new OfflineQueue('k', memoryStore());
    await q.enqueue(seizure);
    await q.enqueue(seizure);
    const res = await q.flush(async () => {
      throw net();
    });
    expect(res).toEqual({ sent: 0, dropped: 0, remaining: 2 });
  });

  it('descarta un item rechazado con 4xx y sigue con el resto', async () => {
    const q = new OfflineQueue('k', memoryStore());
    await q.enqueue(seizure);
    await q.enqueue({ kind: 'dailyLog', date: '2026-11-01', payload: {} });
    let n = 0;
    const res = await q.flush(async () => {
      if (n++ === 0) throw new ApiError(400, 'VALIDATION_ERROR', 'mal');
    });
    expect(res).toEqual({ sent: 1, dropped: 1, remaining: 0 });
  });

  it('no ejecuta dos vaciados simultáneos', async () => {
    const q = new OfflineQueue('k', memoryStore());
    await q.enqueue(seizure);
    const send = jest.fn(async () => undefined);
    await Promise.all([q.flush(send), q.flush(send)]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('notifica el conteo a los suscriptores', async () => {
    const q = new OfflineQueue('k', memoryStore());
    const seen: number[] = [];
    q.subscribe((c) => seen.push(c));
    await q.enqueue(seizure);
    await q.flush(async () => undefined);
    expect(seen).toEqual([0, 1, 0]);
  });

  it('isRetryable distingue red/5xx de 4xx', () => {
    expect(isRetryable(net())).toBe(true);
    expect(isRetryable(new ApiError(503, 'INTERNAL_ERROR', 'x'))).toBe(true);
    expect(isRetryable(new ApiError(422, 'VALIDATION_ERROR', 'x'))).toBe(false);
  });
});
