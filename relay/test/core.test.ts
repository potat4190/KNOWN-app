/** Prompt-contract tests with mocked provider replies (no network). */
import {
  KEYS,
  HttpError,
  RateLimiter,
  handleMatch,
  handleTranslate,
  library,
  matchPrompt,
  parseJson,
  translatePrompt,
  validateMatch,
} from '../src/core';
import { glooProvider } from '../src/providers.gloo';

const reply = (...outs: (string | Error)[]) => {
  const fn = jest.fn(async () => {
    const o = outs.shift() ?? '';
    if (o instanceof Error) throw o;
    return o;
  });
  return fn;
};

describe('prompts', () => {
  it('lists every story in the content pack, and no others', () => {
    const lib = library();
    for (const k of KEYS) expect(lib).toContain(`- ${k}: `);
    expect(KEYS).toHaveLength(16);
  });
  it('carries the rules: one key, no Scripture, ≤25 words in her language, risk, JSON only', () => {
    const p = matchPrompt('my');
    expect(p).toContain('Choose exactly one key from the library');
    expect(p).toContain('never quote or paraphrase Scripture');
    expect(p).toContain('at most 25 words) written in Burmese');
    expect(p).toContain('"risk": true only if');
    expect(p).toContain('Reply with only JSON');
  });
  it('translate asks for a back-translation', () => {
    expect(translatePrompt('my', 'en')).toMatch(/from Burmese into English[\s\S]*back into Burmese/);
  });
});

describe('/match', () => {
  it('returns a validated result', async () => {
    const c = reply(
      '{"key":"neh","confidence":0.82,"reason":"Nehemiah heard hard news from home and brought it to God.","feelings":["fear"],"risk":false}',
    );
    await expect(handleMatch({ text: "I can't reach my family", lang: 'en' }, c)).resolves.toEqual({
      key: 'neh',
      confidence: 0.82,
      reason: 'Nehemiah heard hard news from home and brought it to God.',
      feelings: ['fear'],
      risk: false,
    });
    expect(c).toHaveBeenCalledTimes(1);
  });
  it('tolerates code fences', () => {
    expect(parseJson('```json\n{"key":"ruth"}\n```')).toEqual({ key: 'ruth' });
  });
  it('rejects a key outside the library, retries once, then fails', async () => {
    const c = reply('{"key":"job","confidence":0.9}', '{"key":"jonah","confidence":0.9}');
    await expect(handleMatch({ text: 'hi', lang: 'en' }, c)).rejects.toBeInstanceOf(HttpError);
    expect(c).toHaveBeenCalledTimes(2);
  });
  it('recovers on the retry', async () => {
    const c = reply('not json', '{"key":"ps142","confidence":0.6,"reason":"","feelings":[],"risk":false}');
    await expect(handleMatch({ text: 'alone', lang: 'en' }, c)).resolves.toMatchObject({ key: 'ps142' });
  });
  it('drops a reason that quotes', () => {
    expect(validateMatch({ key: 'neh', confidence: 0.8, reason: 'As it says, “I wept”.' })!.reason).toBe('');
  });
  it('keeps feelings internal and limited to the four', () => {
    expect(
      validateMatch({ key: 'neh', confidence: 0.8, feelings: ['fear', 'shame', 'anger', 'sadness'] })!.feelings,
    ).toEqual(['fear', 'anger']);
  });
  it('passes the risk flag through', async () => {
    const c = reply('{"key":"ps77","confidence":0.7,"reason":"","feelings":["sadness"],"risk":true}');
    await expect(handleMatch({ text: '...', lang: 'en' }, c)).resolves.toMatchObject({ risk: true });
  });
  it('validates input length (≤1200)', async () => {
    await expect(handleMatch({ text: 'x'.repeat(1201), lang: 'en' }, reply())).rejects.toMatchObject({ status: 413 });
    await expect(handleMatch({ text: '' }, reply())).rejects.toMatchObject({ status: 400 });
  });
});

describe('/translate', () => {
  it('returns translation and back-translation', async () => {
    const c = reply('{"translation":"Hi, could you just listen?","back":"မင်္ဂလာပါ၊ နားထောင်ပေးနိုင်မလား။"}');
    await expect(handleTranslate({ text: 'မင်္ဂလာပါ', from: 'my', to: 'en' }, c)).resolves.toEqual({
      translation: 'Hi, could you just listen?',
      back: 'မင်္ဂလာပါ၊ နားထောင်ပေးနိုင်မလား။',
    });
  });
  it('validates languages and length (≤1500)', async () => {
    await expect(handleTranslate({ text: 'hi', from: 'en', to: 'en' }, reply())).rejects.toMatchObject({ status: 400 });
    await expect(handleTranslate({ text: 'hi', from: 'en', to: 'xx' }, reply())).rejects.toMatchObject({ status: 400 });
    await expect(handleTranslate({ text: 'x'.repeat(1501), from: 'en', to: 'ja' }, reply())).rejects.toMatchObject({
      status: 413,
    });
  });
});

describe('Gloo adapter', () => {
  const env = { GLOO_API_KEY: 'k', GLOO_MODEL: 'gloo-anthropic-claude-haiku-4.5' };
  const res = (status: number, body: unknown) =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
  it('sends exactly one routing field (model) to the guarded endpoint', async () => {
    const f = jest.fn((_url: string, _init?: RequestInit) =>
      res(200, { choices: [{ message: { content: '{"key":"neh"}' } }] }),
    );
    const complete = glooProvider(env, f as unknown as typeof fetch);
    await complete('sys', 'user');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://platform.ai.gloo.com/ai/v2/guarded/chat/completions');
    const body = JSON.parse(String(init!.body));
    expect(body.model).toBe(env.GLOO_MODEL);
    expect(body).not.toHaveProperty('auto_routing');
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer k');
  });
  it('a guarded refusal is a failure (the app falls back to its on-device matcher)', async () => {
    const f = jest.fn(() =>
      res(200, { choices: [{ message: { content: null, refusal: 'I can’t help with that.' } }] }),
    );
    const complete = glooProvider(env, f as unknown as typeof fetch);
    await expect(handleMatch({ text: 'hi', lang: 'en' }, complete)).rejects.toMatchObject({ status: 502 });
  });
  it('a non-JSON reply is a failure', async () => {
    const f = jest.fn(() => res(200, { choices: [{ message: { content: 'Here is a story for you…' } }] }));
    await expect(
      handleMatch({ text: 'hi', lang: 'en' }, glooProvider(env, f as unknown as typeof fetch)),
    ).rejects.toMatchObject({ status: 502 });
  });
});

describe('rate limiting', () => {
  it('limits per key within the window', () => {
    const r = new RateLimiter(2, 1000);
    expect(r.allow('a', 0)).toBe(true);
    expect(r.allow('a', 1)).toBe(true);
    expect(r.allow('a', 2)).toBe(false);
    expect(r.allow('b', 2)).toBe(true);
    expect(r.allow('a', 1001)).toBe(true);
  });
});
