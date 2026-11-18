import type { Adherence, DailyLog, Medication, Seizure } from '@/lib/api/schemas';
import { formatDay, formatDuration, formatTime, toDateKey } from '@/lib/dates';

export interface ReportInput {
  patientName: string;
  from: Date;
  to: Date;
  seizures: readonly Seizure[];
  medications: readonly Medication[];
  adherence: Adherence | null;
  logs: readonly DailyLog[];
}

export interface DoctorReport {
  patientName: string;
  fromKey: string;
  toKey: string;
  seizures: Seizure[];
  totalSeizures: number;
  avgDurationSeconds: number | null;
  avgSeverity: number | null;
  topTriggers: { name: string; count: number }[];
  medications: { name: string; dose: string; times: string; adherencePct: number | null }[];
  adherencePct: number | null;
  avgSleepHours: number | null;
  avgStress: number | null;
  logDays: number;
}

const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n: number | null): number | null => (n === null ? null : Math.round(n * 10) / 10);
const defined = (xs: (number | null)[]): number[] => xs.filter((x): x is number => x !== null);

/** true si el instante cae entre el inicio del día local de `from` y el fin del día local de `to`. */
export function inRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1).getTime();
  return t >= start && t < end;
}

export function topTriggers(seizures: readonly Seizure[], limit = 5): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of seizures) for (const t of new Set(s.triggersNoted)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function buildReport(input: ReportInput): DoctorReport {
  const seizures = input.seizures.filter((s) => inRange(s.startedAt, input.from, input.to)).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const perMed = new Map((input.adherence?.perMedication ?? []).map((m) => [m.medicationId, m.rate]));
  const fromKey = toDateKey(input.from);
  const toKey = toDateKey(input.to);
  const logs = input.logs.filter((l) => l.logDate.slice(0, 10) >= fromKey && l.logDate.slice(0, 10) <= toKey);
  const rate = input.adherence?.rate ?? null;
  const avgDuration = avg(defined(seizures.map((s) => s.durationSeconds)));
  return {
    patientName: input.patientName,
    fromKey,
    toKey,
    seizures,
    totalSeizures: seizures.length,
    avgDurationSeconds: avgDuration === null ? null : Math.round(avgDuration),
    avgSeverity: round1(avg(defined(seizures.map((s) => s.severity)))),
    topTriggers: topTriggers(seizures),
    medications: input.medications
      .filter((m) => m.active)
      .map((m) => {
        const r = perMed.get(m.id);
        return {
          name: m.name,
          dose: [m.dose, m.unit].filter(Boolean).join(' '),
          times: m.scheduleTimes.join(', '),
          adherencePct: r === null || r === undefined ? null : Math.round(r * 100),
        };
      }),
    adherencePct: rate === null ? null : Math.round(rate * 100),
    avgSleepHours: round1(avg(defined(logs.map((l) => l.sleepHours)))),
    avgStress: round1(avg(defined(logs.map((l) => l.stressLevel)))),
    logDays: logs.length,
  };
}

const orNone = (v: number | null, unit = ''): string => (v === null ? 'Sin datos' : `${v}${unit}`);

export function reportToText(r: DoctorReport): string {
  const L: string[] = [`REPORTE PARA EL MÉDICO - ${r.patientName}`, `Periodo: ${r.fromKey} a ${r.toKey}`, '', `CRISIS: ${r.totalSeizures}`];
  L.push(`Duración promedio: ${r.avgDurationSeconds === null ? 'Sin datos' : formatDuration(r.avgDurationSeconds)}`);
  L.push(`Severidad promedio (1-5): ${orNone(r.avgSeverity)}`);
  for (const s of r.seizures) {
    const extra = [s.seizureType, s.severity ? `severidad ${s.severity}/5` : null, s.durationSeconds !== null ? formatDuration(s.durationSeconds) : null].filter(Boolean).join(', ');
    const trig = s.triggersNoted.length ? ` | desencadenantes: ${s.triggersNoted.join(', ')}` : '';
    const note = s.notes ? ` | ${s.notes}` : '';
    L.push(`- ${formatDay(s.startedAt)} ${formatTime(s.startedAt)}${extra ? ` (${extra})` : ''}${trig}${note}`);
  }
  L.push('', 'DESENCADENANTES MÁS FRECUENTES:');
  if (r.topTriggers.length) r.topTriggers.forEach((t) => L.push(`- ${t.name}: ${t.count} ${t.count === 1 ? 'vez' : 'veces'}`));
  else L.push('- Ninguno registrado');
  L.push('', `MEDICACIÓN (adherencia general: ${orNone(r.adherencePct, '%')}):`);
  if (r.medications.length) {
    for (const m of r.medications) L.push(`- ${m.name}${m.dose ? ` ${m.dose}` : ''}${m.times ? ` a las ${m.times}` : ''} | adherencia ${orNone(m.adherencePct, '%')}`);
  } else L.push('- Sin medicación activa');
  L.push('', `HÁBITOS (${r.logDays} días registrados):`, `Sueño promedio: ${orNone(r.avgSleepHours, ' h')}`, `Estrés promedio (1-10): ${orNone(r.avgStress)}`);
  L.push('', 'Generado por EpiSafe IA a partir de los registros del paciente. No es un diagnóstico.');
  return L.join('\n');
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const SECTION = /^(CRISIS|DESENCADENANTES|MEDICACIÓN|HÁBITOS|REPORTE)/;

/** HTML simple (para expo-print) con el mismo contenido que el texto. Todo el texto va escapado. */
export function reportToHtml(r: DoctorReport): string {
  const body = reportToText(r)
    .split('\n')
    .map((line) => {
      if (line === '') return '';
      if (line.startsWith('- ')) return `<li>${escapeHtml(line.slice(2))}</li>`;
      return SECTION.test(line) ? `<h2>${escapeHtml(line)}</h2>` : `<p>${escapeHtml(line)}</p>`;
    })
    .join('\n');
  return `<html><head><meta charset="utf-8"/><style>body{font-family:Helvetica,Arial,sans-serif;padding:24px;color:#111}h2{font-size:16px;margin:16px 0 4px}p,li{font-size:13px;margin:2px 0}li{margin-left:18px}</style></head><body>${body}</body></html>`;
}
