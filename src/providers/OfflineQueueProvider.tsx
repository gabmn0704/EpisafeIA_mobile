import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { endpoints } from '@/lib/api/instance';
import { OfflineQueue, type NewPendingItem, type PendingItem } from '@/lib/offlineQueue';
import { useAuth } from './AuthProvider';

const RETRY_MS = 20_000;

interface OfflineValue {
  pending: number;
  syncing: boolean;
  enqueue: (item: NewPendingItem) => Promise<void>;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineValue>({ pending: 0, syncing: false, enqueue: async () => undefined, syncNow: async () => undefined });

function send(item: PendingItem): Promise<unknown> {
  return item.kind === 'seizure' ? endpoints.seizures.create(item.payload) : endpoints.dailyLogs.upsert(item.date, item.payload);
}

/** Guarda localmente lo que no se pudo enviar y lo reintenta solo (cada 20 s y al volver a la app). */
export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const qc = useQueryClient();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const queueRef = useRef<OfflineQueue | null>(null);

  // Una cola por usuario: los pendientes de una cuenta nunca se envían con otra.
  useEffect(() => {
    if (status !== 'signedIn' || !user) {
      queueRef.current = null;
      return;
    }
    const q = new OfflineQueue(`episafe.offline.v1.${user.id}`, AsyncStorage);
    queueRef.current = q;
    const off = q.subscribe(setPending);
    void q.load();
    return off;
  }, [status, user]);

  const syncNow = useCallback(async () => {
    const q = queueRef.current;
    if (!q || q.count === 0) return;
    setSyncing(true);
    try {
      const res = await q.flush(async (item) => void (await send(item)));
      if (res.sent > 0) {
        await Promise.all(['seizures', 'dailyLog', 'dailyLogs', 'dashboard', 'risk'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
      }
    } finally {
      setSyncing(false);
    }
  }, [qc]);

  const enqueue = useCallback(async (item: NewPendingItem) => {
    await queueRef.current?.enqueue(item);
  }, []);

  useEffect(() => {
    if (pending === 0) return;
    const id = setInterval(() => void syncNow(), RETRY_MS);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void syncNow());
    void syncNow();
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [pending > 0, syncNow]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ pending, syncing, enqueue, syncNow }), [pending, syncing, enqueue, syncNow]);
  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export const useOfflineQueue = () => useContext(OfflineContext);
