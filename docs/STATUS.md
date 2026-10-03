# Status

Honest state of the build. Updated at the end of every phase.

## Phase 0: setup and content (done 2026-10-03)

- Expo SDK 56 project, TypeScript strict, dependencies installed with `npx expo install`.
- `npm run content:extract`: all brief asserts pass (16 passages; 16 paths × 5 languages; `T.en` 111 keys; `PW_UI` 174 per language; `BR` 11 per language; `BREATH` 16; 4 pictures; 14 scenes; Arabic Scripture only for `neh` and `hab`). 3 drafted overrides applied.
- `npm run content:validate`: passes with review items (see `CONTENT_REVIEW.md`).
- Not yet verified: a native dev-client build (phase 1 builds it).

## Waiting on people

| What | Who | Where |
|---|---|---|
| Verify every Help number and link (`verifiedBy`, `verifiedOn`) | Kezia | `src/config/help-lines.ts` (5 entries empty) |
| YouVersion version ids per language | Team, after `npm run yv:versions` | `src/config/bible-versions.ts` |
| Default AI provider for the relay | Team | `relay/` `AI_PROVIDER` |
| Which build is demoed Oct 6–8 | Team | — |
| Drafted strings and overrides | Dorcas, Deb, native readers | `CONTENT_REVIEW.md` |
| Paused-moment retention (3 days) privacy review | Kezia, Dorcas | `src/config/privacy.ts` |
| Student findings for the Validation test | Team | `src/config/bible-track.ts` |
