/**
 * Builds src/content/rotation.json: the story pool per picture selection
 * (brief section 8.2). The output is plain data so the team can edit pools.
 *
 *   pool(sel) = unique([MATRIX[sel].path, MATRIX[sel].alt, ALT[MATRIX[sel].path]])
 *             + (sel contains S, F or A ? LAMENTS : [])
 *
 * The file is only written when missing, or with --reset, so team edits survive.
 *
 * Lament psalms stay out of the joy-only pool (J). ps77 stays reserved for
 * "I don't have the words".
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(__dirname, '..', 'src', 'content');
const read = (f: string) => JSON.parse(readFileSync(join(OUT, f), 'utf8'));

const { matrix } = read('matrix.json') as { matrix: Record<string, { path: string; alt: string }> };
const alt = read('alt.json') as Record<string, string>;
const laments = read('laments.json') as string[];

export function defaultPool(sel: string): string[] {
  const m = matrix[sel];
  const people = [...new Set([m.path, m.alt, alt[m.path]].filter(Boolean))];
  return /[SFA]/.test(sel) ? [...people, ...laments.filter((l) => !people.includes(l))] : people;
}

const pools: Record<string, string[]> = {};
for (const sel of Object.keys(matrix)) pools[sel] = defaultPool(sel);

const file = join(OUT, 'rotation.json');
if (existsSync(file) && !process.argv.includes('--reset')) {
  console.log("rotation.json exists; keeping the team's pools (run with --reset to restore the defaults).");
  process.exit(0);
}
writeFileSync(file, JSON.stringify(pools, null, 2) + '\n', 'utf8');
console.log(
  'Rotation pools:\n' +
    Object.entries(pools)
      .map(([k, v]) => `  ${k.padEnd(2)}  ${v.join(', ')}`)
      .join('\n'),
);
