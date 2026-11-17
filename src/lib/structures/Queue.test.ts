import { Queue } from './Queue';

describe('Queue', () => {
  it('dequeues in FIFO order', () => {
    const q = new Queue<string>();
    q.enqueue('a');
    q.enqueue('b');
    q.enqueue('c');
    expect(q.dequeue()).toBe('a');
    expect(q.peek()).toBe('b');
    expect(q.size).toBe(2);
  });

  it('handles emptying and refilling (tail reset)', () => {
    const q = new Queue<number>();
    q.enqueue(1);
    expect(q.dequeue()).toBe(1);
    expect(q.isEmpty()).toBe(true);
    expect(q.dequeue()).toBeUndefined();
    q.enqueue(2);
    q.enqueue(3);
    expect(q.toArray()).toEqual([2, 3]);
  });

  it('clear empties the queue', () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.clear();
    expect(q.size).toBe(0);
    expect(q.peek()).toBeUndefined();
  });
});
