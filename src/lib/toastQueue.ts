import { Queue } from '@/lib/structures';

export type ToastTone = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  /** Accion opcional, p. ej. "Deshacer". */
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

export type ToastInput = Omit<Toast, 'id' | 'durationMs' | 'tone'> & { tone?: ToastTone; durationMs?: number };

/**
 * Gestiona toasts con una cola FIFO: solo uno visible a la vez; los demas
 * esperan su turno en orden de llegada (nada se pierde ni se pisa).
 */
export class ToastQueue {
  private queue = new Queue<Toast>();
  private seq = 0;
  private current: Toast | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onChange: (current: Toast | null) => void) {}

  get pending(): number {
    return this.queue.size;
  }

  show(input: ToastInput): number {
    const toast: Toast = { id: ++this.seq, tone: 'info', durationMs: 3500, ...input };
    this.queue.enqueue(toast);
    if (!this.current) this.advance();
    return toast.id;
  }

  dismiss(): void {
    this.advance();
  }

  clear(): void {
    this.queue.clear();
    this.advance();
  }

  private advance(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.current = this.queue.dequeue() ?? null;
    this.onChange(this.current);
    if (this.current) {
      const id = this.current.id;
      this.timer = setTimeout(() => {
        if (this.current?.id === id) this.advance();
      }, this.current.durationMs);
    }
  }
}
