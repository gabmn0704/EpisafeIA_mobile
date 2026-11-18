/**
 * Genera los PNG de marca desde el SVG de src/theme/brandMark.ts.
 * Uso: npm run brand:assets
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND, markSvg } from '../src/theme/brandMark';

const out = join(__dirname, '..', 'assets');
const brandDir = join(__dirname, '..', 'assets', 'brand');
mkdirSync(brandDir, { recursive: true });

function png(svg: string, size: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: undefined }).render().asPng();
}
const write = (name: string, svg: string, size: number, dir = out) => {
  writeFileSync(join(dir, name), png(svg, size));
  process.stdout.write(`${name} (${size}px)
`);
};

// Icono de la tienda / iOS: fondo opaco, escudo ocupa ~78 %.
write('icon.png', markSvg({ scale: 0.82, background: 'night' }), 1024);
// Android adaptativo: primer plano con zona segura (66 %) y fondo aparte.
write('android-icon-foreground.png', markSvg({ scale: 0.64 }), 1024);
write(
  'android-icon-background.png',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><radialGradient id="h" cx="80%" cy="10%" r="70%"><stop offset="0" stop-color="${BRAND.violetDeep}" stop-opacity="0.55"/><stop offset="1" stop-color="${BRAND.night}" stop-opacity="0"/></radialGradient></defs><rect width="1024" height="1024" fill="${BRAND.night}"/><rect width="1024" height="1024" fill="url(#h)"/></svg>`,
  1024,
);
// Icono monocromo (Android 13+ temático) y de notificación.
write('android-icon-monochrome.png', markSvg({ scale: 0.64, mono: true }), 1024);
write('notification-icon.png', markSvg({ scale: 0.92, mono: true }), 96);
// Splash (fondo lo pone app.json) y favicon.
write('splash-icon.png', markSvg({ scale: 0.7 }), 1024);
write('favicon.png', markSvg({ scale: 0.96, background: 'night' }), 256);
// Hoja de revision (no se empaqueta).
write('preview-sheet.png', markSvg({ scale: 1, background: 'night' }), 1024, brandDir);
