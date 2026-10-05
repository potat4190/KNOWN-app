# Status

Honest state of the build. Updated at the end of every phase. Last update: 2026-10-04.

## Summary

| Phase | State |
|---|---|
| 0 Setup and content | Done. Extraction asserts all pass; validator passes with 16 review items. |
| 1 Foundation | Done; runs on the Android dev build (emulator). |
| 2 Core flow | Done; walked on the Android dev build and on the website (see below). |
| 3 YouVersion | **On.** Versions chosen 2026-10-04 (en 206 WEBUS, ja 81 JA1955, zh 43 CSBS, ar 195; my none). Card text, label, copyright, "Open in YouVersion" (reader), Settings picker and offline fallback checked on the Android dev build and on the live website. See "YouVersion" and "Known issues". |
| 4 Rotation | Done (pools, algorithm, bridge rule, persistence, panel section, tests). |
| 5 Music | Config, controller with fades, mute, Settings switch, panel preview, README + CREDITS, tests. **No tracks configured**, so no music plays and the switch is hidden. |
| 6 Onboarding guide | First-run cards and coach marks; tips fixed 2026-10-04 (they never have to be tapped away and never point at hidden targets), checked on the dev build and the web. |
| 7 Judge panel | Full port + sections, Settings toggle, env gating. Clock offset now applies only while the panel is on. |
| 8 Own words and translate | Relay Worker (both providers) + tests + `test-set.jsonl`; app client with 8 s timeout and on-device fallback. **Relay not deployed** (team step), so own words use the on-device matcher and Translate is hidden. |
| 9 Hardening | Maestro flows (`e2e/`), `docs/QA.md`, EAS profiles, `PRIVACY.md`. Ad-hoc Maestro checks ran on the emulator 2026-10-04; the full `e2e/` suite was not re-run. |
| Web | **Live** at https://potat4190.github.io/KNOWN/, built from this app's code (`npm run web:export`). See "Web version". |

Tests: `npm test` = content validator + 328 Jest tests (app + relay), all passing. `npm run typecheck` and `npm run lint` are clean (2026-10-04).

## Web version (GitHub Pages)

Built by `npm run web:export` into `../KNOWN-webapp` (repo `potat4190/KNOWN`, Pages from `main` `/`, base path `/KNOWN`, `.nojekyll`, `404.html` = `index.html` for deep links). Storage is `localStorage` (not encrypted).

**What was wrong with the live site (2026-10-04):** it still served the old hand-written HTML/JS build. The app-generated export had been copied into the folder but never committed or pushed (so `_expo/` and `404.html` were missing and deep links showed GitHub's 404), and local `main` was 3 commits behind GitHub (a CNAME added and removed in the web UI). Fixed by committing and pushing the export (`51e955a`).

**Web-only adapters** (`*.web.ts(x)`, phones never load them): `sql-store.web.ts`, `kv.web.ts`, `Sheet.web.tsx`, `direction.web.ts`, `a11y-focus.web.ts`, plus (2026-10-04) `youversion-web.web.ts` (keeps the browser's fetch and the page height; the SDK's components are made for phone WebViews and broke both), `BibleVersionSheet.web.tsx` (the SDK's picker sheet renders nothing in browsers) and `Rise.web.tsx` (Reanimated's web layout animations pinned every screen section with `position: absolute`, so growing content overlapped). The app entry is now `index.ts` (Expo Router's documented custom entry) so the fetch guard loads before the SDK.

**Walked on the live site (headless Edge, 2026-10-04):**

| Checked | Result |
|---|---|
| Golden path (language → cards → Home → Feel → Scripture → Pray → After → Keep → Save → Done → Moments → Moment → Settings), English, 390×844, light, YouVersion | Works; card shows WEBUS text, label, copyright; saved to localStorage; no console errors. |
| Same, Arabic, 390×844, light | Works; `<html dir="rtl">`, YouVersion 195 text, label ت ع م, copyright; reference reads نحميا 1:2–4. |
| Same, Burmese, 390×844, dark | Works; bundled Judson with Burmese digits, no YouVersion pill (no version for Burmese). |
| Same, English, 1366×900, dark | Works (see "Known issues": the phone layout stretches full width). |
| "Open in YouVersion" → reader (Nehemiah 1, WEBUS) | Works. |
| Settings → Bible version → picker → BSB → next card in BSB | Works (local build of the same code; live picker not re-run to spare the rate limit). |
| Own words: crisis phrase → Crisis → Help; continue to Scripture | Works. |
| Own words, on-device match → Nehemiah ("Matched on this phone") | Works. |
| Doesn't fit after editing the prayer → asks → swaps | Works. |
| ✕ → Save this step for later → Paused → reopen the site → Recover (Escape doesn't close it) → Continue | Works. |
| Sit; Reach out (no relay: copy, no Translate) | Works. |
| Judge panel: on → tab → panel → fast-forward (4 days) → reset → off (clock back to 0) | Works. |
| Moment detail → delete; Settings → Delete everything (keeps language) | Works. |
| Deep link `/KNOWN/moments` | Works (Pages answers 404 with the app, so the console shows one expected 404). |
| YouVersion from the browser (CORS) | api.youversion.com allows any origin; no relay proxy needed. |

Not checked on the web: real phones, Safari/iOS, Firefox; TalkBack/VoiceOver equivalents (screen readers in browsers).

## Fixes from the handoff (section 3), 2026-10-04

| Bug | Fix | Commit |
|---|---|---|
| Crisis gaps ("I don't want to be here anymore", "I can't go on", "nobody would miss me", "I want to disappear") | Added to the **drafted** list `src/config/crisis-extra.ts` (status stays drafted, for Kezia), with variants and without everyday uses | `1903c7f` |
| Silent memory-only storage | Lost key → new DB; otherwise Keep/Done say honestly that nothing survives closing (new drafted copy `store_memory`, `saved_memory`) | `6dd3477` |
| Judge-panel clock offset when the panel is off | Offset only while the panel is on; switching it off resets it | `0dae1a9` |
| Tips: blocking, 6 "Got it" taps, ring on Continue below the fold | Seen tips don't return; content targets only while in view; header/actions targets marked fixed | `ede2bf7` |
| `Screen.tsx` Rise keys | Keyed by place in the screen | `73f88ff` |
| Double taps on Feel Continue / Keep Save | In-flight guards | `638e2a2` |
| Keep → Finish without saving discards edits silently | Asks first (existing drafted `discard_q`) | `1073271` |
| Arabic references "4–1:2" | Numbers in a left-to-right isolate (U+2066…U+2069) | `6ece1d1` |
| Maestro `fresh-start` didn't turn tips off | Already fixed in `257cba9` | — |
| `findNodeHandle` → `a11y-focus` | Code replaced (`83d9a9e`); **TalkBack/VoiceOver focus not verified** | — |

Left alone (team decisions): bridge headings SF.h/FJ.h say "afraid"; the matcher sends "my phone battery died" to Mary. Relay rate limiter is best effort (put a spending cap on the key before deploying).

## Device runs

### Android emulator, 2026-10-04 (dev build, JS from Metro)

| Checked | Result |
|---|---|
| Scripture card with YouVersion text, label, copyright (Ruth 1:16 WEBUS; Psalm 13:1–2, 5 WEBUS; Psalm 142:4–5 BSB) | Works, but see "Known issues" (slow / intermittent in the dev build). |
| "Open in YouVersion" → reader in the same version (Nehemiah 1, WEBUS) | Works. |
| Settings → Bible version picker → BSB → next card in BSB | Works. |
| Offline (airplane mode) → bundled WEBBE, pill "Open in YouVersion (BSB)" | Works. |
| Tips: first-visit tip; not back after leaving without "Got it"; Scripture tip only when its target is visible; Continue never covered | Works. |
| Keep → Finish without saving after editing the prayer → asks; Cancel returns | Works. |
| Arabic: restart right-to-left, reference reads نحميا 1:2–4, label ت ع م and copyright | Works; the verse text itself did not appear within ~25 s in that run (see "Known issues"). |

### Android emulator, 2026-10-03 (dev build)

Language → cards → Home; Feel → Nehemiah 1 (WEBBE); Psalm 142; Pray; Keep/Done save-once; Settings; coach-mark fixes; SerifGate; ✕ → Paused; judge panel fast-forward; rotation. All worked (details in git history of this file).

## YouVersion (chosen 2026-10-04)

`src/config/bible-versions.ts`: en **206 WEBUS**, ja **81 JA1955**, zh **43 CSBS**, ar **195 SAT**, my none (bundled Judson). Every library passage was fetched live in each version and verse numbering matches the bundled editions.

- WEBUS says "Yahweh" where the bundled WEBBE says "the LORD".
- JA1955 has no copyright string in the API, so its card shows the label only.
- CSBS (© Global Bible Initiative) and 195 SAT (© 2016 Bible League International) are different translations from the bundled 和合本 and Van Dyck, which YouVersion doesn't offer for this key.
- Her Settings choice is one value for all app languages (a version picked in Chinese stays when she switches the app to English). Asked the team; unchanged.

## Known issues and risks

- **YouVersion rate limit.** After heavy testing the key got `429 Rate limit exceeded` (`Retry-After: 300`) for ~25 minutes, and later one burst was refused. The key is public in the website's JavaScript, so every visitor shares it. Opening the reader costs ~15 API calls. When limited, the app's preflight falls back to the bundled text (correct), but if the limit hits after the preflight the SDK's text view shows its own error in the card. Don't hammer the key before the demo.
- **SDK text view on Android (dev build): slow and intermittent.** In the dev build each SDK WebView loads its code from Metro (10–20 s for the first card), and Expo's DOM bridge logs `DomWebView.injectJavaScript has been rejected … Unable to find view with tag` (LogBox toast). When that happens the card can stay empty or show "The Bible server couldn't be reached" although the API answered. This is inside Expo's DOM bridge / the YouVersion SDK, not KNOWN's code. A release build was started on 2026-10-04 to check this (see below).
- Web, desktop: the phone layout stretches to the full window width (huge scene banner). Asked the team whether to center a phone-width column.
- Web, Burmese at 390 px: the wider Help pill overlaps the last step dot in the session header.
- Native Fabric SIGSEGV seen twice on 2026-10-03 (not reproduced since).

## Not verified

- TalkBack/VoiceOver focus after the `findNodeHandle` replacement.
- The storage-failure path on a real device (unit-tested only).
- Double taps on a device (unit-tested only).
- iOS, Safari, real Android phones, EAS builds.
- The full Maestro `e2e/` suite (only ad-hoc flows were run).

## Waiting on people

| What | Who | Where |
|---|---|---|
| Default AI provider for the relay (Gloo or Claude) | Team | `relay/wrangler.toml` `AI_PROVIDER` |
| Which build is demoed Oct 6–8 | Team | — |
| Deploy the relay + set `EXPO_PUBLIC_AI_RELAY_URL` | Team | `relay/README.md` |
| Bible version choice per app language vs one choice for all | Team | `src/state/prefs.ts`, `app/(tabs)/more.tsx` |
| Web on desktop: phone-width column or full width | Team | — |
| Web privacy notice (data stays unencrypted in the browser; the copy says "on this phone") | Team / Kezia | — |
| Verify every Help number and link (`verifiedBy`, `verifiedOn`) | Kezia | `src/config/help-lines.ts` (5 entries empty) |
| Review the drafted supplementary crisis phrases (4 added 2026-10-04; other languages may need them too) | Kezia | `src/config/crisis-extra.ts` |
| Review `relay/test-set.jsonl` (200 drafted sentences, incl. short crisis phrases) | Kezia | `relay/test-set.jsonl` |
| Three reviewed bridge lines that name her emotion | Dorcas | `CONTENT_REVIEW.md` |
| Drafted strings (68 keys × 5 languages) and 3 drafted overrides | Dorcas, Deb, native readers | `CONTENT_REVIEW.md` |
| Paused-moment retention (3 days) privacy review | Kezia, Dorcas | `src/config/privacy.ts` |
| Student findings for the Validation test | Team | `src/config/bible-track.ts` |
| Zero data retention with the AI provider | Team | `docs/PRIVACY.md` |
| Music tracks (optional) and their licences | Team | `src/config/music.ts`, `assets/audio/CREDITS.md` |
| App icon / splash (still Expo placeholders) | Team | `assets/images/` |
