import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { keys } from '@/hooks/queries';
import { endpoints } from '@/lib/api/instance';
import { alertTitle, pickNewAlerts } from '@/lib/alertWatch';
import { notifyNow } from '@/lib/notifications';

/**
 * Consulta las alertas del reloj cada 30 s y lanza una notificación local
 * por cada alerta nueva (el backend las detecta en la ingesta de muestras).
 */
export function useAlertWatcher(): void {
  const { data } = useQuery({
    queryKey: keys.wearableAlerts,
    queryFn: () => endpoints.wearables.alerts().then((r) => r.alerts),
    refetchInterval: 30_000,
  });
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    const { fresh, seen: next } = pickNewAlerts(seen.current, data);
    seen.current = next;
    for (const alert of fresh) void notifyNow(alertTitle(alert.kind), 'Abre EpiSafe para revisar y avisar a tus contactos si lo necesitas.');
  }, [data]);
}
