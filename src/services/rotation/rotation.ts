/**
 * Story rotation (brief section 8.2): picking the same pictures again opens a
 * different story from that selection's pool. Pure; the RNG is injectable.
 *
 * 1. The first time a selection key is used on this device → MATRIX[sel].path.
 * 2. Every later time → draw from a per-key shuffle bag (Fisher–Yates):
 *    never repeat the last story for that key, exhaust the bag before any
 *    repeat, and on refill make sure the first item ≠ the last shown.
 * 3. Advance only when the story actually opens (Continue on Feel).
 */
export type RotationEntry = { bag: string[]; last: string | null; count: number };
export type RotationState = Record<string, RotationEntry>;
export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A fresh bag for `pool` whose first draw is not `last`. Bags are drawn from the front. */
export function refill(pool: readonly string[], last: string | null, rng: Rng): string[] {
  const bag = shuffle(pool, rng);
  if (bag.length > 1 && bag[0] === last) {
    const k = 1 + Math.floor(rng() * (bag.length - 1));
    [bag[0], bag[k]] = [bag[k], bag[0]];
  }
  return bag;
}

/** Which story would open next, without advancing (for the judge panel). */
export function peek(entry: RotationEntry | undefined, primary: string, pool: readonly string[]): string {
  if (!entry || entry.count === 0) return primary;
  const bag = entry.bag.filter((k) => pool.includes(k));
  const next = bag.find((k) => k !== entry.last);
  return next ?? '(new shuffle)';
}

/**
 * Opens a story for `sel`. Returns the story key and the next state for that key.
 * `pool` is rotation.json[sel]; `primary` is MATRIX[sel].path.
 */
export function draw(
  entry: RotationEntry | undefined,
  primary: string,
  pool: readonly string[],
  rng: Rng = Math.random,
): { path: string; entry: RotationEntry } {
  if (!entry || entry.count === 0) {
    // First time: the team's reviewed best match. The bag starts with the rest.
    const rest = pool.filter((k) => k !== primary);
    return { path: primary, entry: { bag: shuffle(rest, rng), last: primary, count: 1 } };
  }
  const usable = pool.length > 1 ? pool : [primary];
  // Drop anything the team removed from the pool since the bag was made.
  let bag = entry.bag.filter((k) => usable.includes(k));
  // Never back-to-back: skip the last shown if it is at the front (possible after a pool edit).
  if (bag[0] === entry.last && bag.length > 1) bag = [...bag.slice(1), bag[0]];
  if (!bag.length || bag[0] === entry.last) bag = refill(usable, entry.last, rng);
  const [path, ...rest] = bag;
  return { path, entry: { bag: rest, last: path, count: entry.count + 1 } };
}
