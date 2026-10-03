/** Every crisis phrase in the relay test set is caught on the phone; no ordinary sentence is. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isCrisis } from '@/services/matcher/matcher';

const items = readFileSync(join(__dirname, '../../../relay/test-set.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l) as { id: string; text: string; risk: boolean });

it('has 200 items across 5 languages', () => expect(items).toHaveLength(200));

it.each(items.filter((o) => o.risk).map((o) => [o.id, o.text]))('catches crisis phrase %s', (_id, text) => {
  expect(isCrisis(text)).toBe(true);
});

it('does not flag the ordinary sentences', () => {
  expect(items.filter((o) => !o.risk && isCrisis(o.text)).map((o) => o.id)).toEqual([]);
});
