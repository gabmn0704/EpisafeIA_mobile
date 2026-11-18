import { Trie } from './Trie';

describe('Trie', () => {
  const build = () => {
    const t = new Trie<string>();
    ['Levetiracetam', 'Lamotrigina', 'Lacosamida', 'Carbamazepina', 'Acido valproico'].forEach((w) =>
      t.insert(w, w.toUpperCase()),
    );
    return t;
  };

  it('finds entries by prefix, sorted', () => {
    expect(build().search('la').map((r) => r.word)).toEqual(['Lacosamida', 'Lamotrigina']);
  });

  it('ignores case and accents', () => {
    const t = new Trie();
    t.insert('Ácido Valproico');
    expect(t.search('ACIDO').map((r) => r.word)).toEqual(['Ácido Valproico']);
  });

  it('matches any word of a multiword entry', () => {
    expect(build().search('valp').map((r) => r.word)).toEqual(['Acido valproico']);
  });

  it('returns payloads and respects the limit', () => {
    const t = build();
    expect(t.search('l', 1)).toHaveLength(1);
    expect(t.search('leve')[0]?.payload).toBe('LEVETIRACETAM');
  });

  it('returns nothing for unknown or empty prefixes', () => {
    const t = build();
    expect(t.search('zzz')).toEqual([]);
    expect(t.search('  ')).toEqual([]);
  });

  it('has() checks exact entries and size counts insertions', () => {
    const t = build();
    expect(t.has('lamotrigina')).toBe(true);
    expect(t.has('lamo')).toBe(false);
    expect(t.size).toBe(5);
    t.insert('   ');
    expect(t.size).toBe(5);
  });
});
