/**
 * @jest-environment jsdom
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Guard = typeof import('../youversion-web.web');
const loadGuard = (): Guard => {
  let mod: Guard | undefined;
  jest.isolateModules(() => {
    mod = require('../youversion-web.web');
  });
  return mod!;
};

describe('YouVersion SDK inside the web page (youversion-web.web.ts)', () => {
  const testFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = testFetch;
    document.getElementById('known-page-height')?.remove();
  });

  it("keeps the browser's fetch after the SDK replaces it", () => {
    const browserFetch = jest.fn() as unknown as typeof fetch;
    globalThis.fetch = browserFetch;
    const { keepYouVersionInPage } = loadGuard();
    // What the SDK's ensureDomContentCache() does when its module loads.
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    keepYouVersionInPage();
    expect(globalThis.fetch).toBe(browserFetch);
  });

  it("pins the page height once, over the SDK text view's `height: auto`", () => {
    const { keepYouVersionInPage } = loadGuard();
    keepYouVersionInPage();
    keepYouVersionInPage();
    const styles = document.querySelectorAll('#known-page-height');
    expect(styles).toHaveLength(1);
    expect(styles[0]!.textContent).toBe('html, body, #root { height: 100% !important; }');
  });

  it('loads before the SDK: first import of the app entry, before the router', () => {
    const root = join(__dirname, '../../..');
    expect(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).main).toBe('index.ts');
    const entry = readFileSync(join(root, 'index.ts'), 'utf8');
    const imports = [...entry.matchAll(/^import '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual(['./src/lib/youversion-web', 'expo-router/entry']);
  });

  it('the root layout takes fetch back after importing the SDK, before rendering', () => {
    const src = readFileSync(join(__dirname, '../../../app/_layout.tsx'), 'utf8');
    const sdkImport = src.indexOf("from '@youversion/platform-react-native-expo-ui'");
    const call = src.search(/^keepYouVersionInPage\(\);$/m);
    expect(sdkImport).toBeGreaterThan(0);
    expect(call).toBeGreaterThan(sdkImport);
    expect(call).toBeLessThan(src.indexOf('export default function RootLayout'));
  });
});

describe('phone build (youversion-web.ts)', () => {
  it('leaves fetch alone', () => {
    const before = globalThis.fetch;
    jest.isolateModules(() => {
      const { keepYouVersionInPage } = require('../youversion-web') as typeof import('../youversion-web');
      keepYouVersionInPage();
    });
    expect(globalThis.fetch).toBe(before);
  });
});
