# KNOWN relay (Cloudflare Worker)

The app works fully without this relay. With it, "My own words" is matched by an AI model to the team-reviewed story library, and Reach out can translate a message with a back-translation. The AI never writes, quotes or explains Scripture: it picks one story key and writes one warm sentence.

| Endpoint | Body | Reply |
|---|---|---|
| `POST /match` | `{text, lang}` (text ≤ 1200 chars) | `{key, confidence, reason, feelings, risk}` |
| `POST /translate` | `{text, from, to}` (text ≤ 1500 chars) | `{translation, back}` |
| `POST /lines` | `{text, lang}` (her prayer, ≤ 1500 chars) | `{lines}`: her prayer split for slow reading in Stay here a moment |
| `GET /health` | | `{ok: true}` |

- Replies are validated: JSON only, the key must be in the content pack, a quoting reason is dropped, one retry, then `502` (the app falls back to its on-device matcher).
- `/lines` (team decision 2026-10-06): the AI chooses only where her prayer breaks into lines. A reply whose lines are not exactly her text (any word added, dropped, corrected or translated) is rejected here and again in the app, which then splits the prayer on the phone.
- **Request bodies are never logged.** Logs hold route, provider, status, latency and error class only.
- Rate limits: 30/min per IP and 20/min per install id (random UUID from the app, not tied to identity). Per isolate, best effort; add a Cloudflare Rate Limiting binding for production.
- No CORS (mobile only).

## Deploy (the team's step)

1. A Cloudflare account, then from this folder:
   ```bash
   npm install
   npx wrangler login
   ```
2. Pick the provider in `wrangler.toml` (`AI_PROVIDER = "anthropic"` or `"gloo"`) and set its key **as a secret** (never in the app, `.env`, `app.config.ts` or this repo):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY   # for AI_PROVIDER=anthropic
   npx wrangler secret put GLOO_API_KEY        # for AI_PROVIDER=gloo
   ```
3. `npm run deploy`. Put the Worker URL in the app's `.env` as `EXPO_PUBLIC_AI_RELAY_URL` and rebuild/restart Metro.
4. Check: `curl -X POST $URL/match -H 'Content-Type: application/json' -d '{"text":"I cannot reach my family","lang":"en"}'`.

## Switching the AI provider

Both adapters share the same prompts, validation and tests (`src/core.ts`); only `complete(system, user)` differs.

- **Anthropic (Claude API):** `ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`), key in `ANTHROPIC_API_KEY`. Uses the official `@anthropic-ai/sdk`.
- **Gloo AI Studio:** `POST https://platform.ai.gloo.com/ai/v2/guarded/chat/completions` with `Authorization: Bearer $GLOO_API_KEY`. Exactly one routing field: `model` from `GLOO_MODEL`, a Claude-family id from the live catalog `GET https://platform.ai.gloo.com/platform/v2/models` (for example `gloo-anthropic-claude-haiku-4.5`). No `auto_routing`, so results stay reproducible. The guarded endpoint adds moderation and may refuse or reword crisis input: a refusal or non-JSON reply is treated as a failure, and the app's on-device crisis check always runs first.

Change `AI_PROVIDER` in `wrangler.toml` and redeploy. Which provider is the default is an open team decision (brief 18.2 #2).

## Before launch

- Arrange **zero data retention**: ask the team's Anthropic org admin, or ask Gloo (its docs don't state retention). Record the answer in `docs/PRIVACY.md`.
- Integrity (later phase): Apple App Attest / Play Integrity tokens checked here, so only the real app can call the relay.

## Tests

Run from the repo root: `npm test` (the `relay` Jest project). Prompt-contract tests use mocked provider replies; no network.

`test-set.jsonl` is a **drafted** review scaffold: 200 sentences (40 situations × 5 languages) with the hoped-for story key, including short crisis test phrases. It is for Kezia's safeguarding review and for checking the matcher; regenerate it with `python test/build-test-set.py`.
