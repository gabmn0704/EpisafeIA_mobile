/**
 * Buffer circular de capacidad fija. Al llenarse sobrescribe el dato mas
 * antiguo, por lo que la memoria es constante aunque el reloj emita por horas.
 */
export class CircularBuffer<T> {
  private readonly data: (T | undefined)[];
  private start = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('La capacidad debe ser un entero positivo');
    }
    this.data = new Array<T | undefined>(capacity).fill(undefined);
  }

  get size(): number {
    return this.count;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  /** Agrega un elemento; devuelve el elemento sobrescrito si el buffer estaba lleno. */
  push(item: T): T | undefined {
    if (this.count < this.capacity) {
      this.data[(this.start + this.count) % this.capacity] = item;
      this.count++;
      return undefined;
    }
    const evicted = this.data[this.start];
    this.data[this.start] = item;
    this.start = (this.start + 1) % this.capacity;
    return evicted;
  }

  /** Mas antiguo primero. */
  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this.count; i++) out.push(this.data[(this.start + i) % this.capacity] as T);
    return out;
  }

  latest(): T | undefined {
    if (this.count === 0) return undefined;
    return this.data[(this.start + this.count - 1) % this.capacity];
  }

  oldest(): T | undefined {
    return this.count === 0 ? undefined : this.data[this.start];
  }

  /** Extrae y devuelve los n elementos mas antiguos (para enviarlos por lotes). */
  drain(n: number = this.count): T[] {
    const take = Math.min(Math.max(0, n), this.count);
    const out: T[] = [];
    for (let i = 0; i < take; i++) {
      out.push(this.data[this.start] as T);
      this.data[this.start] = undefined;
      this.start = (this.start + 1) % this.capacity;
    }
    this.count -= take;
    return out;
  }

  clear(): void {
    this.data.fill(undefined);
    this.start = 0;
    this.count = 0;
  }
}
