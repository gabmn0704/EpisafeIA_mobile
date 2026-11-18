/** Un arrastre cierra la hoja por distancia (> 110 px) o por un gesto rapido (> 800 px/s). */
export function shouldDismissSheet(translationY: number, velocityY: number): boolean {
  'worklet';
  return translationY > 110 || velocityY > 800;
}

/** Hacia abajo sigue al dedo; hacia arriba aplica friccion para no despegar la hoja. */
export function sheetDragOffset(translationY: number): number {
  'worklet';
  return translationY > 0 ? translationY : translationY * 0.12;
}
