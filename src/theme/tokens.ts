/**
 * Sistema de diseno de EpiSafe IA movil.
 * Violeta profundo + lima neon, con superficies en capas:
 *   bg (lienzo) < surface (tarjeta) < surface2 (elemento elevado) < surface3 (control / relleno).
 */
export const colors = {
  // Lienzo y capas
  bg: '#07051a',
  bgTop: '#150d45',
  surface: '#110e2e',
  surface2: '#1a1642',
  surface3: '#262060',
  line: 'rgba(168, 150, 255, 0.16)',
  lineStrong: 'rgba(168, 150, 255, 0.32)',
  highlight: 'rgba(255, 255, 255, 0.07)',
  // Texto
  ink: '#f5f2ff',
  muted: '#b2acdc',
  faint: '#7e78b0',
  // Marca
  brand: '#9172ff',
  brandDeep: '#5b2bff',
  brandSoft: 'rgba(145, 114, 255, 0.16)',
  brandInk: '#0b0723',
  lime: '#c6ff3d',
  limeSoft: 'rgba(198, 255, 61, 0.14)',
  limeInk: '#1b2a00',
  // Semanticos
  coral: '#ff5c78',
  coralSoft: 'rgba(255, 92, 120, 0.16)',
  amber: '#ffc044',
  amberSoft: 'rgba(255, 192, 68, 0.16)',
  orange: '#ff8a3d',
  orangeSoft: 'rgba(255, 138, 61, 0.16)',
  cyan: '#3fdcff',
  cyanSoft: 'rgba(63, 220, 255, 0.14)',
  ok: '#3ddc97',
  okSoft: 'rgba(61, 220, 151, 0.16)',
  white: '#ffffff',
  scrim: 'rgba(5, 3, 18, 0.72)',
} as const;

export const fonts = {
  display: 'Outfit_700Bold',
  displayHeavy: 'Outfit_800ExtraBold',
  displayMedium: 'Outfit_600SemiBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemi: 'Geist_600SemiBold',
} as const;

/** Escala de espaciado 4/8/12/16/24/32 (+48 para pausas grandes). */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 } as const;

/** Ritmo vertical: separacion entre bloques de una pantalla y dentro de un bloque. */
export const rhythm = { block: space.xl, inner: space.md, gutter: space.lg } as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

/** Alto minimo tactil (>= 44pt). */
export const hit = { min: 44, control: 52, large: 60 } as const;

export type RiskLevelKey = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskStyle {
  color: string;
  soft: string;
  ink: string;
  label: string;
  message: string;
}

/** Estados semanticos de riesgo: color solido, fondo suave y tinta legible encima del solido. */
export const riskPalette: Record<RiskLevelKey, RiskStyle> = {
  low: { color: colors.ok, soft: colors.okSoft, ink: '#032a18', label: 'Bajo', message: 'Un buen día para mantener tu rutina.' },
  moderate: { color: colors.amber, soft: colors.amberSoft, ink: '#2e1f00', label: 'Moderado', message: 'Cuida tu sueño y tus medicamentos hoy.' },
  high: { color: colors.orange, soft: colors.orangeSoft, ink: '#2e1200', label: 'Alto', message: 'Evita desencadenantes y avisa a alguien de confianza.' },
  critical: { color: colors.coral, soft: colors.coralSoft, ink: '#2a0510', label: 'Crítico', message: 'Extrema tus precauciones y no te quedes solo.' },
};

/** Elevaciones tintadas de violeta (una sola fuente de luz arriba). */
export const elevation = {
  none: {},
  low: { shadowColor: '#02010d', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  mid: { shadowColor: '#02010d', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  high: { shadowColor: '#02010d', shadowOpacity: 0.55, shadowRadius: 32, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
} as const;

export const shadow = {
  card: elevation.mid,
  glow: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  }),
} as const;

/** Duraciones y curvas de movimiento (ms). Las interacciones frecuentes se mantienen < 300. */
export const motion = {
  fast: 140,
  base: 220,
  slow: 420,
  hero: 1000,
  stagger: 55,
  spring: { damping: 18, stiffness: 260 },
  springSoft: { damping: 20, stiffness: 180 },
} as const;

/** Capas del eje Z. */
export const z = { base: 0, tabBar: 10, fab: 20, sheet: 30, toast: 40 } as const;
