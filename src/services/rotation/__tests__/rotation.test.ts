import { draw, peek, refill, type RotationEntry } from '../rotation';
import { MATRIX, ROTATION, SEL_KEYS } from '@/lib/content';

/** Deterministic RNG (mulberry32). */
const seeded = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function run(sel: keyof typeof MATRIX, n: number, seed = 1) {
  const rng = seeded(seed);
  let e: RotationEntry | undefined;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = draw(e, MATRIX[sel].path, ROTATION[sel], rng);
    e = r.entry;
    out.push(r.path);
  }
  return { out, entry: e! };
}

describe('story rotation (8.2)', () => {
  it.each(SEL_KEYS)('first pick for %s is the reviewed primary', (sel) => {
    expect(run(sel, 1).out[0]).toBe(MATRIX[sel].path);
  });

  it.each(SEL_KEYS)('never repeats back to back over 200 picks (%s)', (sel) => {
    for (const seed of [1, 7, 42]) {
      const { out } = run(sel, 200, seed);
      for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
    }
  });

  it.each(SEL_KEYS)('every pool member appears within pool.length picks after the first (%s)', (sel) => {
    const pool = ROTATION[sel];
    const { out } = run(sel, 1 + pool.length);
    expect(new Set(out.slice(0, 1 + pool.length))).toEqual(new Set(pool));
  });

  it('exhausts the bag before any repeat', () => {
    const pool = ROTATION.FA;
    const { out } = run('FA', 1 + pool.length * 3, 9);
    // After the first pick, each full bag contains every story once.
    for (let b = 0; b < 2; b++) {
      const bag = out.slice(1 + pool.length - 1 + b * pool.length, 1 + pool.length - 1 + (b + 1) * pool.length);
      if (bag.length === pool.length) expect(new Set(bag).size).toBe(pool.length);
    }
  });

  it('state persists: continuing from a saved entry behaves like an uninterrupted run', () => {
    const first = run('S', 5, 3);
    const saved: RotationEntry = JSON.parse(JSON.stringify(first.entry));
    const next = draw(saved, MATRIX.S.path, ROTATION.S, seeded(99));
    expect(next.path).not.toBe(saved.last);
    expect(next.entry.count).toBe(saved.count + 1);
  });

  it('refill never starts with the last story shown', () => {
    for (let i = 0; i < 50; i++) expect(refill(['a', 'b', 'c'], 'a', seeded(i))[0]).not.toBe('a');
  });

  it('a two-story pool alternates', () => {
    const { out } = run('J', 6);
    expect(out).toEqual(['samaritan', 'hannah', 'samaritan', 'hannah', 'samaritan', 'hannah']);
  });

  it('peek shows the primary before first use', () => {
    expect(peek(undefined, 'neh', ROTATION.F)).toBe('neh');
  });
});
