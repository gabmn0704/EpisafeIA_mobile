export interface AlertLike {
  id: string;
  kind: string;
  detectedAt: string;
  convertedEventId?: string | null;
}

const COPY: Record<string, string> = {
  tachycardia: 'Taquicardia sostenida detectada',
  motion_convulsive: 'Movimiento convulsivo detectado',
  hr_anomaly: 'Pulso fuera de lo habitual',
  fall: 'Posible caída detectada',
};

export function alertTitle(kind: string): string {
  return COPY[kind] ?? 'Alerta de salud';
}

/**
 * Alertas que aún no se han notificado y siguen abiertas (no convertidas en
 * emergencia). En la primera carga (`seen === null`) solo se marcan como vistas:
 * no se bombardea al usuario con alertas viejas al abrir la app.
 */
export function pickNewAlerts<T extends AlertLike>(seen: ReadonlySet<string> | null, alerts: readonly T[]): { fresh: T[]; seen: Set<string> } {
  const next = new Set(seen ?? []);
  const fresh: T[] = [];
  for (const a of alerts) {
    if (!next.has(a.id) && seen !== null && !a.convertedEventId) fresh.push(a);
    next.add(a.id);
  }
  return { fresh, seen: next };
}
