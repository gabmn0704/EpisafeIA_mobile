/**
 * Marca de EpiSafe IA: un escudo (protección) atravesado por una onda de actividad
 * (EEG / pulso) que termina en un punto lima: la alerta que la IA anticipa.
 * Geometría en un lienzo de 1024 x 1024; la usan la app y scripts/generate-brand-assets.ts.
 */
export const BRAND = {
  night: '#08061c',
  panel: '#0e0a2c',
  violet: '#9172ff',
  violetDeep: '#5b2bff',
  lime: '#c6ff3d',
} as const;

/** Contorno exterior del escudo. */
export const SHIELD_OUTER =
  'M512 118 C612 178 724 206 820 214 C828 214 836 222 836 232 V512 C836 716 704 868 512 934 C320 868 188 716 188 512 V232 C188 222 196 214 204 214 C300 206 412 178 512 118 Z';

/** Contorno interior (marco de 44 px): el escudo reducido hacia su centro. */
export const SHIELD_INNER =
  'M512 176 C604 230 704 256 792 264 C792 264 792 266 792 270 V512 C792 692 676 822 512 882 C348 822 232 692 232 512 V270 C232 266 232 264 232 264 C320 256 420 230 512 176 Z';

/** Onda de actividad: línea base, espiga y recuperación. */
export const WAVE = 'M290 548 H368 L430 424 L508 676 L582 416 L626 548 H650';

/** Punto de alerta al final de la onda. */
export const DOT = { cx: 738, cy: 548, r: 30 } as const;

/** SVG completo del símbolo en un lienzo de 1024. `scale` lo reduce hacia el centro. */
export function markSvg(opts: { scale?: number; mono?: boolean; background?: 'night' | 'none' } = {}): string {
  const { scale = 1, mono = false, background = 'none' } = opts;
  const t = `translate(512 512) scale(${scale}) translate(-512 -512)`;
  const bg =
    background === 'night'
      ? `<rect width="1024" height="1024" fill="${BRAND.night}"/><circle cx="800" cy="140" r="520" fill="url(#halo)"/>`
      : '';
  const body = mono
    ? `<g transform="${t}">
         <mask id="cut">
           <rect width="1024" height="1024" fill="#fff"/>
           <path d="${WAVE}" fill="none" stroke="#000" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
           <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r + 4}" fill="#000"/>
         </mask>
         <path d="${SHIELD_OUTER}" fill="#fff" mask="url(#cut)"/>
       </g>`
    : `<g transform="${t}">
         <path d="${SHIELD_OUTER}" fill="url(#shield)"/>
         <path d="${SHIELD_INNER}" fill="${BRAND.panel}"/>
         <path d="${WAVE}" fill="none" stroke="${BRAND.lime}" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
         <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${BRAND.lime}"/>
       </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="shield" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stop-color="${BRAND.violet}"/>
        <stop offset="1" stop-color="${BRAND.violetDeep}"/>
      </linearGradient>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="${BRAND.violetDeep}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${BRAND.violetDeep}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${bg}${body}
  </svg>`;
}
