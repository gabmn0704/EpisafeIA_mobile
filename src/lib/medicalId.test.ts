import type { Contact, Medication } from '@/lib/api/schemas';
import { buildSnapshot, EMPTY_PROFILE, isProfileEmpty, medicalIdText, parseProfile, parseSnapshot } from './medicalId';

const med = (name: string, active: boolean, dose: string | null = '500', unit: string | null = 'mg'): Medication => ({ id: name, name, dose, unit, scheduleTimes: [], active, notes: null });
const contact = (name: string, priority: number, phone: string | null): Contact => ({ id: name, name, relationship: 'Madre', phone, email: null, priority, notifySms: true, notifyEmail: false });

describe('medicalId', () => {
  it('parseProfile tolera datos nulos o corruptos', () => {
    expect(parseProfile(null)).toEqual(EMPTY_PROFILE);
    expect(parseProfile('{no json')).toEqual(EMPTY_PROFILE);
    expect(parseProfile(JSON.stringify({ allergies: '  Penicilina ', bloodType: 'O+', x: 1 })).allergies).toBe('Penicilina');
  });

  it('buildSnapshot filtra inactivas y contactos sin teléfono, ordena por prioridad', () => {
    const s = buildSnapshot([med('Valproato', true), med('Viejo', false)], [contact('B', 2, '300'), contact('A', 1, '311'), contact('C', 0, null)], new Date('2026-11-01T00:00:00Z'));
    expect(s.medications).toEqual([{ name: 'Valproato', dose: '500 mg' }]);
    expect(s.contacts.map((c) => c.name)).toEqual(['A', 'B']);
    expect(s.savedAt).toBe('2026-11-01T00:00:00.000Z');
  });

  it('parseSnapshot rechaza formas inválidas', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('{"medications":1}')).toBeNull();
  });

  it('isProfileEmpty', () => {
    expect(isProfileEmpty(EMPTY_PROFILE)).toBe(true);
    expect(isProfileEmpty({ ...EMPTY_PROFILE, allergies: 'x' })).toBe(false);
  });

  it('medicalIdText incluye alergias, medicación y contactos', () => {
    const s = buildSnapshot([med('Valproato', true)], [contact('Ana', 1, '311')]);
    const t = medicalIdText('Luis', { ...EMPTY_PROFILE, allergies: 'Penicilina', bloodType: 'O+' }, s);
    expect(t).toContain('Alergias: Penicilina');
    expect(t).toContain('- Valproato 500 mg');
    expect(t).toContain('- Ana (Madre): 311');
    expect(medicalIdText('Luis', EMPTY_PROFILE, null)).toContain('Alergias: No registradas');
  });
});
