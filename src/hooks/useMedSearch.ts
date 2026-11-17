import { useMemo } from 'react';
import { COMMON_ANTISEIZURE_DRUGS } from '@/data/drugs';
import type { Medication } from '@/lib/api/schemas';
import { Trie } from '@/lib/structures';

/** Trie local con antiepilépticos comunes y los medicamentos del usuario: autocompleta sin red. */
export function useMedSearch(userMeds: readonly Medication[] | undefined) {
  const trie = useMemo(() => {
    const t = new Trie();
    COMMON_ANTISEIZURE_DRUGS.forEach((d) => t.insert(d));
    userMeds?.forEach((m) => t.insert(m.name));
    return t;
  }, [userMeds]);
  return (query: string, limit = 5): string[] => trie.search(query, limit).map((r) => r.word);
}
