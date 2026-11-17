import { contactFormSchema, fieldErrors, loginSchema, medicationFormSchema, normalizeTime, registerSchema } from './validation';

describe('validation', () => {
  it('validates login and reports field errors', () => {
    expect(loginSchema.safeParse({ email: 'ana@correo.co', password: 'x' }).success).toBe(true);
    const bad = loginSchema.safeParse({ email: 'ana', password: '' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(fieldErrors(bad.error)).toEqual({ email: 'Correo inválido', password: 'Escribe tu contraseña' });
  });

  it('requires letters and digits in the registration password', () => {
    const base = { fullName: 'Ana Gómez', email: 'ana@correo.co' };
    expect(registerSchema.safeParse({ ...base, password: 'Secreta123' }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'corta1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'solo letras aqui' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: '12345678' }).success).toBe(false);
  });

  it('requires a phone or an email for contacts', () => {
    expect(contactFormSchema.safeParse({ name: 'Mamá', phone: '+57 300 123 4567' }).success).toBe(true);
    expect(contactFormSchema.safeParse({ name: 'Mamá', email: 'mama@correo.co' }).success).toBe(true);
    const none = contactFormSchema.safeParse({ name: 'Mamá', phone: '', email: '' });
    expect(none.success).toBe(false);
    if (!none.success) expect(fieldErrors(none.error).phone).toBe('Indica teléfono o correo');
  });

  it('requires at least one valid time for medications', () => {
    expect(medicationFormSchema.safeParse({ name: 'Lamotrigina', times: [] }).success).toBe(false);
    expect(medicationFormSchema.safeParse({ name: 'Lamotrigina', times: ['08:00', '20:30'] }).success).toBe(true);
    expect(medicationFormSchema.safeParse({ name: 'Lamotrigina', times: ['25:00'] }).success).toBe(false);
  });

  it('normalizes times', () => {
    expect(normalizeTime('8:5')).toBe('08:05');
    expect(normalizeTime(' 21.30 ')).toBe('21:30');
    expect(normalizeTime('24:00')).toBeNull();
    expect(normalizeTime('abc')).toBeNull();
  });
});
