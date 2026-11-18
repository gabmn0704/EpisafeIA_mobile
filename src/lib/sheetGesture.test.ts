import { sheetDragOffset, shouldDismissSheet } from './sheetGesture';

describe('sheetGesture', () => {
  it('dismisses by distance or velocity', () => {
    expect(shouldDismissSheet(130, 0)).toBe(true);
    expect(shouldDismissSheet(20, 900)).toBe(true);
    expect(shouldDismissSheet(40, 200)).toBe(false);
  });
  it('applies friction when dragging up', () => {
    expect(sheetDragOffset(50)).toBe(50);
    expect(sheetDragOffset(-100)).toBeCloseTo(-12);
  });
});
