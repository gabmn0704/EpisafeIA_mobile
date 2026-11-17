/**
 * Pila LIFO con capacidad opcional. Se usa para deshacer cambios del
 * registro diario: cuando se supera la capacidad se descarta lo mas antiguo.
 */
export class Stack<T> {
  private items: T[] = [];

  constructor(private readonly capacity: number = Number.POSITIVE_INFINITY) {
    if (capacity < 1) throw new RangeError('La capacidad debe ser al menos 1');
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  push(item: T): void {
    this.items.push(item);
    if (this.items.length > this.capacity) this.items.shift();
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  clear(): void {
    this.items = [];
  }

  /** Del fondo al tope. */
  toArray(): T[] {
    return [...this.items];
  }
}
