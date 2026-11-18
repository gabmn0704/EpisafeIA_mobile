import { Stack } from './Stack';

describe('Stack', () => {
  it('pops in LIFO order', () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    s.push(3);
    expect(s.pop()).toBe(3);
    expect(s.pop()).toBe(2);
    expect(s.peek()).toBe(1);
    expect(s.size).toBe(1);
  });

  it('returns undefined when empty', () => {
    const s = new Stack<string>();
    expect(s.isEmpty()).toBe(true);
    expect(s.pop()).toBeUndefined();
    expect(s.peek()).toBeUndefined();
  });

  it('drops the oldest entry when capacity is exceeded', () => {
    const s = new Stack<number>(2);
    [1, 2, 3].forEach((n) => s.push(n));
    expect(s.toArray()).toEqual([2, 3]);
  });

  it('clears and rejects invalid capacity', () => {
    const s = new Stack<number>();
    s.push(1);
    s.clear();
    expect(s.isEmpty()).toBe(true);
    expect(() => new Stack(0)).toThrow(RangeError);
  });

  it('toArray returns a copy', () => {
    const s = new Stack<number>();
    s.push(1);
    s.toArray().push(9);
    expect(s.size).toBe(1);
  });
});
