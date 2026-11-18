const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

class TrieNode<T> {
  children = new Map<string, TrieNode<T>>();
  entries: { word: string; payload: T }[] = [];
}

/**
 * Trie para autocompletar medicamentos localmente (sin red).
 * Ignora mayusculas y acentos; admite varias palabras por entrada
 * ("Acido valproico" se encuentra escribiendo "val").
 */
export class Trie<T = undefined> {
  private root = new TrieNode<T>();
  private total = 0;

  get size(): number {
    return this.total;
  }

  insert(word: string, payload?: T): void {
    const trimmed = word.trim();
    if (!trimmed) return;
    const entry = { word: trimmed, payload: payload as T };
    const tokens = new Set([normalize(trimmed), ...normalize(trimmed).split(/\s+/)]);
    for (const token of tokens) {
      if (!token) continue;
      let node = this.root;
      for (const ch of token) {
        let next = node.children.get(ch);
        if (!next) {
          next = new TrieNode<T>();
          node.children.set(ch, next);
        }
        node = next;
      }
      if (!node.entries.some((e) => e.word === trimmed)) node.entries.push(entry);
    }
    this.total++;
  }

  /** Entradas cuyo texto (o alguna de sus palabras) empieza con el prefijo. */
  search(prefix: string, limit = 8): { word: string; payload: T }[] {
    const p = normalize(prefix);
    if (!p) return [];
    let node: TrieNode<T> | undefined = this.root;
    for (const ch of p) {
      node = node.children.get(ch);
      if (!node) return [];
    }
    const found = new Map<string, { word: string; payload: T }>();
    const pending: TrieNode<T>[] = [node];
    while (pending.length) {
      const cur = pending.pop() as TrieNode<T>;
      for (const e of cur.entries) found.set(e.word, e);
      for (const child of cur.children.values()) pending.push(child);
    }
    return [...found.values()].sort((a, b) => a.word.localeCompare(b.word, 'es')).slice(0, limit);
  }

  has(word: string): boolean {
    const p = normalize(word);
    let node: TrieNode<T> | undefined = this.root;
    for (const ch of p) {
      node = node.children.get(ch);
      if (!node) return false;
    }
    return node.entries.some((e) => normalize(e.word) === p);
  }
}
