/**
 * Lists the Bible versions YouVersion offers for KNOWN's five languages, so
 * the team can choose the default id per language (src/config/bible-versions.ts).
 *
 *   npm run yv:versions                 versions enabled for this app key
 *   npm run yv:versions -- --all        the whole catalog (all_available=true)
 *
 * Reads EXPO_PUBLIC_YOUVERSION_APP_KEY from .env. Never prints the key.
 */
const KEY = process.env.EXPO_PUBLIC_YOUVERSION_APP_KEY ?? '';
const API = 'https://api.youversion.com/v1/bibles';
const all = process.argv.includes('--all');

// ISO 639-3 codes; Chinese and Arabic are tried under both macro and individual codes.
const LANGS: [string, string[]][] = [
  ['en', ['eng']],
  ['my', ['mya']],
  ['zh', ['zho', 'cmn']],
  ['ja', ['jpn']],
  ['ar', ['ara', 'arb']],
];

type Row = {
  id: number;
  abbreviation?: string;
  localized_abbreviation?: string;
  title?: string;
  localized_title?: string;
  copyright?: string | null;
  language_tag?: string;
  [k: string]: unknown;
};

async function page(code: string, token?: string): Promise<{ data: Row[]; next?: string; status: number }> {
  const u = new URL(API);
  u.searchParams.append('language_ranges[]', code);
  if (all) u.searchParams.set('all_available', 'true');
  if (token) u.searchParams.set('page_token', token);
  const res = await fetch(u, { headers: { 'X-YVP-App-Key': KEY, Accept: 'application/json' } });
  if (!res.ok) return { data: [], status: res.status };
  const text = await res.text();
  if (!text.trim()) return { data: [], status: res.status };
  const j = JSON.parse(text) as { data?: Row[]; next_page_token?: string };
  return { data: j.data ?? [], next: j.next_page_token || undefined, status: res.status };
}

async function main() {
  if (!KEY) {
    console.error('EXPO_PUBLIC_YOUVERSION_APP_KEY is not set (.env). Nothing to list.');
    process.exit(1);
  }
  for (const [lang, codes] of LANGS) {
    console.log(`\n=== ${lang} (${codes.join(', ')})${all ? ' · all available' : ''}`);
    const seen = new Set<number>();
    for (const code of codes) {
      let token: string | undefined;
      do {
        const r = await page(code, token);
        if (r.status !== 200) {
          console.log(
            `  ${code}: HTTP ${r.status}${r.status === 401 || r.status === 403 ? ' (key rejected or not permitted)' : ''}`,
          );
          break;
        }
        for (const v of r.data) {
          if (seen.has(v.id)) continue;
          seen.add(v.id);
          const abbr = v.localized_abbreviation || v.abbreviation || '';
          const title = v.localized_title || v.title || '';
          // Licence status: whatever the live response says (field names are read, not assumed).
          const licence = v.copyright ? String(v.copyright).replace(/\s+/g, ' ').slice(0, 90) : '(no copyright field)';
          console.log(`  ${String(v.id).padStart(5)}  ${abbr.padEnd(14)} ${title}  ·  ${licence}`);
        }
        token = r.next;
      } while (token);
    }
    if (!seen.size) console.log('  (none)');
  }
  console.log('\nChoose one id per language, then tell the team so it goes in src/config/bible-versions.ts.');
}

void main();
