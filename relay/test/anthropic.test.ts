/** Anthropic adapter with the SDK mocked (no network). */
const mockCreate = jest.fn();
jest.mock(
  '@anthropic-ai/sdk',
  () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } })) }),
  { virtual: true },
);

import { anthropicProvider, providerFor } from '../src/providers';
import { handleMatch } from '../src/core';

beforeEach(() => mockCreate.mockReset());

it('uses the model from env (default claude-haiku-4-5-20251001) with system + user', async () => {
  mockCreate.mockResolvedValue({
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: '{"key":"ruth","confidence":0.7,"reason":"","feelings":[],"risk":false}' }],
  });
  const complete = anthropicProvider({ ANTHROPIC_API_KEY: 'k' });
  await expect(handleMatch({ text: 'starting over', lang: 'en' }, complete)).resolves.toMatchObject({ key: 'ruth' });
  const args = mockCreate.mock.calls[0][0];
  expect(args.model).toBe('claude-haiku-4-5-20251001');
  expect(args.system).toContain('LIBRARY');
  expect(args.messages).toEqual([{ role: 'user', content: expect.stringContaining('starting over') }]);
});

it('honours ANTHROPIC_MODEL', async () => {
  mockCreate.mockResolvedValue({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{}' }] });
  await anthropicProvider({ ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'claude-sonnet-5-5' })('s', 'u');
  expect(mockCreate.mock.calls[0][0].model).toBe('claude-sonnet-5-5');
});

it('a refusal is a failure', async () => {
  mockCreate.mockResolvedValue({ stop_reason: 'refusal', content: [] });
  await expect(anthropicProvider({ ANTHROPIC_API_KEY: 'k' })('s', 'u')).rejects.toThrow('refusal');
});

it('AI_PROVIDER picks the adapter; missing keys fail loudly', () => {
  expect(providerFor({ ANTHROPIC_API_KEY: 'k' }).name).toBe('anthropic');
  expect(providerFor({ AI_PROVIDER: 'gloo', GLOO_API_KEY: 'g', GLOO_MODEL: 'm' }).name).toBe('gloo');
  expect(() => providerFor({})).toThrow('ANTHROPIC_API_KEY');
  expect(() => providerFor({ AI_PROVIDER: 'gloo', GLOO_API_KEY: 'g' })).toThrow('GLOO_MODEL');
});
