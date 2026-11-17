import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo').pipe(z.email('Correo inválido')),
  password: z.string().min(1, 'Escribe tu contraseña'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Escribe tu nombre completo').max(120),
  email: z.string().trim().min(1, 'Escribe tu correo').pipe(z.email('Correo inválido')),
  password: z
    .string()
    .min(8, 'Usa al menos 8 caracteres')
    .regex(/[A-Za-z]/, 'Incluye al menos una letra')
    .regex(/[0-9]/, 'Incluye al menos un número'),
});

/** Convierte issues de zod en un mapa campo -> primer mensaje. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Escribe un nombre').max(120),
    relationship: z.string().trim().max(60).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/, 'Teléfono inválido')
      .optional()
      .or(z.literal('')),
    email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  })
  .refine((v) => !!v.phone || !!v.email, { message: 'Indica teléfono o correo', path: ['phone'] });

export const medicationFormSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del medicamento').max(120),
  dose: z.string().trim().max(60).optional(),
  unit: z.string().trim().max(20).optional(),
  times: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:MM)'))
    .min(1, 'Agrega al menos una hora'),
});

/** Normaliza "8:5" o "8.05" a "08:05"; devuelve null si no es una hora válida. */
export function normalizeTime(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
