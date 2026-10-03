/**
 * KNOWN relay (Cloudflare Worker).
 *   POST /match     {text, lang}      → {key, confidence, reason, feelings, risk}
 *   POST /translate {text, from, to}  → {translation, back}
 *
 * Never logs request bodies: only counts, latency and errors. CORS is off
 * (mobile only). Rate-limited per IP and per install id (a random UUID from
 * the app, not tied to identity). `feelings` are for the app's internal
 * mapping only; the app never displays or stores them.
 */
import { HttpError, RateLimiter, handleMatch, handleTranslate } from './core';
import { providerFor, type Env } from './providers';

const byIp = new RateLimiter(30, 60_000);
const byInstall = new RateLimiter(20, 60_000);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const t0 = Date.now();
    const url = new URL(req.url);
    const route = url.pathname;
    if (req.method === 'GET' && route === '/health') return json(200, { ok: true });
    if (req.method !== 'POST' || (route !== '/match' && route !== '/translate'))
      return json(404, { error: 'not found' });

    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    const install = (req.headers.get('X-Install-Id') ?? '').slice(0, 64) || 'none';
    if (!byIp.allow(`ip:${ip}`) || !byInstall.allow(`id:${install}`)) return json(429, { error: 'slow down' });

    let status = 200;
    try {
      const body = await req.json().catch(() => null);
      const { complete, name } = providerFor(env);
      const out = route === '/match' ? await handleMatch(body, complete) : await handleTranslate(body, complete);
      console.log(JSON.stringify({ route, provider: name, status, ms: Date.now() - t0 }));
      return json(200, out);
    } catch (e) {
      status = e instanceof HttpError ? e.status : 500;
      // Log the error class only, never the text she wrote.
      console.log(
        JSON.stringify({ route, status, ms: Date.now() - t0, error: e instanceof HttpError ? e.message : 'internal' }),
      );
      return json(status, { error: status === 500 ? 'internal' : (e as Error).message });
    }
  },
};
