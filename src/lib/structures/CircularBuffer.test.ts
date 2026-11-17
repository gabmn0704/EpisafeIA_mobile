import { CircularBuffer } from './CircularBuffer';

describe('CircularBuffer', () => {
  it('keeps insertion order until full', () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    expect(b.toArray()).toEqual([1, 2]);
    expect(b.isFull()).toBe(false);
  });

  it('overwrites the oldest value when full and reports the evicted one', () => {
    const b = new CircularBuffer<number>(3);
    [1, 2, 3].forEach((n) => b.push(n));
    expect(b.push(4)).toBe(1);
    expect(b.push(5)).toBe(2);
    expect(b.toArray()).toEqual([3, 4, 5]);
    expect(b.oldest()).toBe(3);
    expect(b.latest()).toBe(5);
    expect(b.size).toBe(3);
  });

  it('drain removes oldest items and frees room', () => {
    const b = new CircularBuffer<number>(4);
    [1, 2, 3, 4, 5].forEach((n) => b.push(n)); // 2,3,4,5
    expect(b.drain(2)).toEqual([2, 3]);
    expect(b.toArray()).toEqual([4, 5]);
    b.push(6);
    b.push(7);
    expect(b.toArray()).toEqual([4, 5, 6, 7]);
    expect(b.drain()).toEqual([4, 5, 6, 7]);
    expect(b.size).toBe(0);
  });

  it('drain clamps to the available size', () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    expect(b.drain(10)).toEqual([1]);
    expect(b.drain(-1)).toEqual([]);
  });

  it('peek copies the oldest items without removing them', () => {
    const b = new CircularBuffer<number>(3);
    [1, 2, 3, 4].forEach((n) => b.push(n));
    expect(b.peek(2)).toEqual([2, 3]);
    expect(b.size).toBe(3);
    expect(b.peek(99)).toEqual([2, 3, 4]);
  });

  it('clear resets state and invalid capacity throws', () => {
    const b = new CircularBuffer<number>(2);
    b.push(1);
    b.clear();
    expect(b.latest()).toBeUndefined();
    expect(b.toArray()).toEqual([]);
    expect(() => new CircularBuffer(0)).toThrow(RangeError);
    expect(() => new CircularBuffer(1.5)).toThrow(RangeError);
  });
});
