/**
 * Every palette stays readable: the house colours (light and dark) and all ten mood palettes.
 * WCAG AA, 4.5:1, for every text colour on every surface it is drawn on.
 */
import { colorsFor, type Colors, type Scheme } from '../tokens';
import { MOODS, MOOD_KEYS, moodColors } from '../moods';
import { nativeCardDom, scriptureCardCss } from '@/components/scriptureCardStyle';

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** [foreground, backgrounds] pairs that appear in the app. */
const PAIRS: [keyof Colors, (keyof Colors)[]][] = [
  ['text', ['background', 'surface', 'elevated', 'fillMuted', 'warm']],
  ['textMuted', ['background', 'surface', 'elevated']],
  ['lampInk', ['background', 'surface', 'elevated', 'warm']],
  ['onPrimary', ['primary']],
  ['onLamp', ['lamp']],
  ['danger', ['background', 'elevated', 'dangerBg']],
];

function failures(c: Colors) {
  const out: string[] = [];
  for (const [fg, bgs] of PAIRS)
    for (const bg of bgs) {
      const r = contrast(c[fg], c[bg]);
      if (r < 4.5) out.push(`${fg} ${c[fg]} on ${bg} ${c[bg]}: ${r.toFixed(2)}`);
    }
  return out;
}

const SCHEMES: Scheme[] = ['light', 'dark'];

describe('palettes', () => {
  it.each(SCHEMES)('house palette (%s) is readable', (scheme) => {
    expect(failures(colorsFor(scheme))).toEqual([]);
  });

  it.each(MOOD_KEYS.flatMap((k) => SCHEMES.map((s) => [k, s] as const)))('mood %s (%s) is readable', (k, scheme) => {
    expect(failures(moodColors(colorsFor(scheme), k, scheme))).toEqual([]);
  });

  it('has ten distinct moods, each with its own accent and name', () => {
    expect(MOOD_KEYS).toHaveLength(10);
    expect(new Set(MOOD_KEYS.map((k) => MOODS[k].dark.lamp)).size).toBe(10);
    expect(new Set(MOOD_KEYS.map((k) => MOODS[k].name)).size).toBe(10);
  });

  it('the Scripture card CSS hides headings, moves a titled verse 1 and stays in its scope', () => {
    const css = scriptureCardCss('#known-card-x', { text: '#111111', lampInk: '#222222' });
    const rules = css.split('\n');
    expect(rules.every((r) => r.startsWith('#known-card-x '))).toBe(true);
    expect(css).toContain('#known-card-x .yv-h{display:none !important;}');
    expect(css).toContain('.d .yv-vlbl{display:none !important;}');
    expect(css).toContain('.d:has(.yv-vlbl) + *::before{content:"1"');
    expect(css).toContain('--yv-foreground:#111111');
    expect(css).toContain('--yv-muted-foreground:#222222');
    // Phone: one style element with a fixed id, before and after the content loads.
    const dom = nativeCardDom(scriptureCardCss(':root', { text: '#111111', lampInk: '#222222' }));
    expect(dom.injectedJavaScriptBeforeContentLoaded).toBe(dom.injectedJavaScript);
    expect(dom.injectedJavaScript).toContain("getElementById(id)");
    expect(dom.injectedJavaScript).toContain(':root .yv-h');
  });

  it('dark moods stay dark and light moods stay light (the YouVersion text view follows the scheme)', () => {
    for (const k of MOOD_KEYS) {
      expect(lum(MOODS[k].dark.background)).toBeLessThan(0.03);
      expect(lum(MOODS[k].light.background)).toBeGreaterThan(0.8);
    }
  });
});
