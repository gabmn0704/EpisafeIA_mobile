export interface EvidenceItem {
  label: string;
  value: string;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Traduce el JSON de evidencia del servicio de IA a datos legibles.
 * Solo muestra lo que realmente viene en la respuesta; no completa nada.
 */
export function formatEvidence(evidence: Record<string, unknown> | undefined): EvidenceItem[] {
  if (!evidence) return [];
  const out: EvidenceItem[] = [];

  const n = num(evidence.n) ?? num(evidence.samples) ?? num(evidence.count);
  if (n !== null) out.push({ label: 'Casos', value: String(Math.round(n)) });

  const lift = num(evidence.lift);
  if (lift !== null) out.push({ label: 'Aumento', value: `x${lift.toFixed(1)}` });

  const share = num(evidence.share) ?? num(evidence.rate) ?? num(evidence.proportion);
  if (share !== null) out.push({ label: 'Proporción', value: `${Math.round((share <= 1 ? share * 100 : share))}%` });

  const ci = evidence.ci ?? evidence.confidenceInterval ?? evidence.wilson;
  if (Array.isArray(ci) && ci.length === 2 && ci.every((x) => typeof x === 'number')) {
    const [lo, hi] = ci as [number, number];
    const scale = hi <= 1 ? 100 : 1;
    out.push({ label: 'Intervalo', value: `${Math.round(lo * scale)}-${Math.round(hi * scale)}%` });
  }

  const conf = num(evidence.confidence);
  if (conf !== null) out.push({ label: 'Confianza', value: `${Math.round((conf <= 1 ? conf * 100 : conf))}%` });

  return out;
}

const KIND_META: Record<string, { label: string; icon: 'moon' | 'pill' | 'zap' | 'heart' | 'chart' | 'coffee' }> = {
  sleep: { label: 'Sueño', icon: 'moon' },
  medication: { label: 'Medicación', icon: 'pill' },
  stress: { label: 'Estrés', icon: 'zap' },
  heart: { label: 'Pulso', icon: 'heart' },
  caffeine: { label: 'Cafeína', icon: 'coffee' },
};

/** Etiqueta e icono según el tipo de insight; cualquier tipo desconocido cae en un genérico. */
export function insightKind(kind: string): { label: string; icon: 'moon' | 'pill' | 'zap' | 'heart' | 'chart' | 'coffee' } {
  const key = Object.keys(KIND_META).find((k) => kind.toLowerCase().includes(k));
  return (key && KIND_META[key]) || { label: 'Patrón', icon: 'chart' };
}
