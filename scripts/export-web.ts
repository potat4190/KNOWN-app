/**
 * Builds the web version of KNOWN from this app's own code and copies it into
 * the GitHub Pages folder. The website and the phone app share every screen,
 * text, flow and rule; only a few *.web.ts(x) files differ (storage, sheets,
 * reading direction), because browsers lack the phone's native modules.
 *
 *   npm run web:export                         → ../KNOWN-webapp, served at /KNOWN/
 *   npm run web:export -- --out <dir> --base /<repo>
 *
 * Everything in the output folder is replaced except KEEP below (git history, Claude Code's
 * instructions and the handoff notes, any GitHub Actions workflow).
 * Note: EXPO_PUBLIC_* values from .env (the YouVersion app key) are built into the site's
 * public JavaScript, as they are into the phone app.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const out = resolve(arg('out', '../KNOWN-webapp'));
const base = arg('base', '/KNOWN');
const build = resolve('dist-web');
const KEEP = new Set(['.git', '.github', '.claude', 'CLAUDE.md', 'HANDOFF_WEB.md']);

console.log(`Exporting KNOWN for the web (base ${base}) …`);
rmSync(build, { recursive: true, force: true });
const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', build], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, WEB_BASE_URL: base, APP_VARIANT: process.env.APP_VARIANT || 'preview' },
});
if (r.status !== 0) process.exit(r.status ?? 1);

// GitHub Pages: a deep link (…/KNOWN/session/feel) gets 404.html, which is the app itself.
copyFileSync(join(build, 'index.html'), join(build, '404.html'));
writeFileSync(join(build, '.nojekyll'), '');
writeFileSync(
  join(build, 'README.md'),
  `# KNOWN (web)

This folder is GENERATED from the KNOWN app (\`npm run web:export\` in the app folder).
Don't edit it here: change the app, export again, then commit and push.

Live: https://potat4190.github.io${base}/
`,
);

mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) if (!KEEP.has(name)) rmSync(join(out, name), { recursive: true, force: true });
cpSync(build, out, { recursive: true });
console.log(`Done: ${out}${existsSync(join(out, '.git')) ? ' (git history kept)' : ''}`);
console.log('Next: commit and push that folder; GitHub Pages updates in a minute or two.');
