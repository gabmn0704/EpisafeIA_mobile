import type { Contact, Medication } from '@/lib/api/schemas';

/** Datos que solo viven en el teléfono (el API no tiene endpoint para ellos). */
export interface MedicalProfile {
  bloodType: string;
  allergies: string;
  conditions: string;
  notes: string;
}

export interface MedicalSnapshot {
  medications: { name: string; dose: string }[];
  contacts: { name: string; relationship: string; phone: string }[];
  savedAt: string;
}

export const EMPTY_PROFILE: MedicalProfile = { bloodType: '', allergies: '', conditions: '', notes: '' };

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const clip = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Lee con tolerancia lo guardado (puede venir corrupto o de otra versión). */
export function parseProfile(raw: string | null): MedicalProfile {
  if (!raw) return { ...EMPTY_PROFILE };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return { bloodType: clip(o.bloodType, 4), allergies: clip(o.allergies, 500), conditions: clip(o.conditions, 500), notes: clip(o.notes, 800) };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function parseSnapshot(raw: string | null): MedicalSnapshot | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<MedicalSnapshot>;
    if (!Array.isArray(o.medications) || !Array.isArray(o.contacts)) return null;
    return { medications: o.medications, contacts: o.contacts, savedAt: typeof o.savedAt === 'string' ? o.savedAt : '' };
  } catch {
    return null;
  }
}

/** Copia reducida de medicación activa y contactos (por prioridad) para verla sin conexión. */
export function buildSnapshot(medications: readonly Medication[], contacts: readonly Contact[], now: Date = new Date()): MedicalSnapshot {
  return {
    medications: medications
      .filter((m) => m.active)
      .map((m) => ({ name: m.name, dose: [m.dose, m.unit].filter(Boolean).join(' ') })),
    contacts: [...contacts]
      .sort((a, b) => a.priority - b.priority)
      .filter((c) => !!c.phone)
      .map((c) => ({ name: c.name, relationship: c.relationship ?? '', phone: c.phone as string })),
    savedAt: now.toISOString(),
  };
}

export function isProfileEmpty(p: MedicalProfile): boolean {
  return !p.bloodType && !p.allergies && !p.conditions && !p.notes;
}

/** Texto simple para compartir o imprimir la ficha. */
export function medicalIdText(name: string, p: MedicalProfile, s: MedicalSnapshot | null): string {
  const lines = [`FICHA MÉDICA DE EMERGENCIA - ${name}`, 'Condición: epilepsia'];
  if (p.bloodType) lines.push(`Grupo sanguíneo: ${p.bloodType}`);
  lines.push(`Alergias: ${p.allergies || 'No registradas'}`);
  if (p.conditions) lines.push(`Otras condiciones: ${p.conditions}`);
  lines.push('Medicación actual:');
  if (s && s.medications.length > 0) s.medications.forEach((m) => lines.push(`- ${m.name}${m.dose ? ` ${m.dose}` : ''}`));
  else lines.push('- No registrada');
  lines.push('Contactos de emergencia:');
  if (s && s.contacts.length > 0) s.contacts.forEach((c) => lines.push(`- ${c.name}${c.relationship ? ` (${c.relationship})` : ''}: ${c.phone}`));
  else lines.push('- No registrados');
  if (p.notes) lines.push(`Indicaciones: ${p.notes}`);
  return lines.join('\n');
}
