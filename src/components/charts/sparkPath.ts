export interface SparkGeometry {
  line: string;
  area: string;
  last: { x: number; y: number } | null;
}

/**
 * Convierte una serie en un trazo SVG suavizado (curvas de Catmull-Rom a Bezier).
 * `min`/`max` fijan la escala; si no se dan se usan los de la serie.
 */
export function buildSparkPath(values: readonly number[], width: number, height: number, opts: { min?: number; max?: number; pad?: number } = {}): SparkGeometry {
  if (values.length === 0) return { line: '', area: '', last: null };
  const pad = opts.pad ?? 4;
  const min = opts.min ?? Math.min(...values);
  const maxRaw = opts.max ?? Math.max(...values);
  const max = maxRaw === min ? min + 1 : maxRaw;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const pts = values.map((v, i) => ({
    x: pad + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: pad + innerH - ((Math.min(Math.max(v, min), max) - min) / (max - min)) * innerH,
  }));
  const r = (n: number) => Math.round(n * 100) / 100;
  let line = `M${r((pts[0] as { x: number }).x)},${r((pts[0] as { y: number }).y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? (pts[i] as { x: number; y: number });
    const p1 = pts[i] as { x: number; y: number };
    const p2 = pts[i + 1] as { x: number; y: number };
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C${r(c1x)},${r(c1y)} ${r(c2x)},${r(c2y)} ${r(p2.x)},${r(p2.y)}`;
  }
  const first = pts[0] as { x: number; y: number };
  const last = pts[pts.length - 1] as { x: number; y: number };
  const area = `${line} L${r(last.x)},${height} L${r(first.x)},${height} Z`;
  return { line, area, last };
}
