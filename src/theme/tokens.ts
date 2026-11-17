/**
 * Identidad visual compartida con la web de EpiSafe IA: violeta profundo,
 * verde lima como acento, fondos oscuros con degradado, Outfit + Geist.
 * (Valores tomados del tema oscuro de EpisafeIA_front/src/index.css.)
 */
export const colors = {
  bg: '#08061c',
  bgTop: '#150d45',
  surface: '#120f33',
  surface2: '#1b1748',
  surface3: '#241f5c',
  line: '#2c2766',
  ink: '#f3f0ff',
  muted: '#a9a3d6',
  faint: '#6f69a3',
  brand: '#8a63ff',
  brandDeep: '#5b2bff',
  brandSoft: '#251f5c',
  brandInk: '#0b0723',
  lime: '#c6ff3d',
  limeInk: '#1b2a00',
  coral: '#ff5c78',
  coralSoft: '#3a1425',
  amber: '#ffc044',
  cyan: '#3fdcff',
  ok: '#3ddc97',
  white: '#ffffff',
  scrim: 'rgba(8, 6, 28, 0.72)',
} as const;

export const fonts = {
  display: 'Outfit_700Bold',
  displayHeavy: 'Outfit_800ExtraBold',
  displayMedium: 'Outfit_600SemiBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemi: 'Geist_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, huge: 40 } as const;
export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;

export type RiskLevelKey = 'low' | 'moderate' | 'high' | 'critical';

export const riskPalette: Record<RiskLevelKey, { color: string; label: string; message: string }> = {
  low: { color: colors.ok, label: 'Bajo', message: 'Un buen día para mantener tu rutina.' },
  moderate: { color: colors.amber, label: 'Moderado', message: 'Cuida tu sueño y tus medicamentos hoy.' },
  high: { color: '#ff8a3d', label: 'Alto', message: 'Evita desencadenantes y avisa a alguien de confianza.' },
  critical: { color: colors.coral, label: 'Crítico', message: 'Extrema tus precauciones y no te quedes solo.' },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  }),
} as const;
