interface Node<T> {
  value: T;
  next: Node<T> | null;
}

/**
 * Cola FIFO sobre lista enlazada simple: encolar y desencolar en O(1).
 * Alimenta la cola de toasts y de notificaciones locales.
 */
export class Queue<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;
  private length = 0;

  get size(): number {
    return this.length;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  enqueue(value: T): void {
    const node: Node<T> = { value, next: null };
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this.length++;
  }

  dequeue(): T | undefined {
    const node = this.head;
    if (!node) return undefined;
    this.head = node.next;
    if (!this.head) this.tail = null;
    this.length--;
    return node.value;
  }

  peek(): T | undefined {
    return this.head?.value;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let n = this.head; n; n = n.next) out.push(n.value);
    return out;
  }
}
