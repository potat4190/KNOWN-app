# Status

Honest state of the build. Updated at the end of every phase. Last update: 2026-10-05.

## Summary

| Phase | State |
|---|---|
| 0 Setup and content | Done. Extraction asserts all pass; validator passes with 16 review items. |
| 1 Foundation | Done; runs on the Android dev build and a local release build (emulator). |
| 2 Core flow | Done; walked on the Android emulator and on the live website (see below). |
| 3 YouVersion | **On.** Versions chosen 2026-10-04: en **3034 BSB**, ja 81 JA1955, zh 43 CSBS, ar 195; my none. Her Settings choice is kept per app language. Card text, label, copyright, "Open in YouVersion" (reader), Settings picker and offline fallback checked on Android (dev and release builds) and on the live website. |
| 4 Rotation | Done (pools, algorithm, bridge rule, persistence, panel section, tests). |
| 5 Music | Config, controller with fades, mute, Settings switch, panel preview, README + CREDITS, tests. **No tracks configured**, so no music plays and the switch is hidden. |
| 6 Onboarding guide | First-run cards and coach marks; tips fixed 2026-10-04 (they never have to be tapped away and never point at hidden targets), checked on Android and the web. |
| 7 Judge panel | Full port + sections, Settings toggle, env gating. Clock offset applies only while the panel is on. |
| 8 Own words and translate | Relay Worker (both providers) + tests + `test-set.jsonl`; app client with 8 s timeout and on-device fallback. **Relay not deployed** (team step), so own words use the on-device matcher and Translate is hidden. |
| 9 Hardening | Maestro flows (`e2e/`), `docs/QA.md`, EAS profiles, `PRIVACY.md`. Ad-hoc Maestro checks ran on the emulator 2026-10-04; the full `e2e/` suite was not re-run. |
| Web | **Live** at https://potat4190.github.io/KNOWN/, built from this app's code (`npm run web:export`). See "Web version". |

Tests: `npm test` = content validator + 333 Jest tests (app + relay), all passing. `npm run typecheck` and `npm run lint` are clean (2026-10-05).

## Web version (GitHub Pages)

Built by `npm run web:export` into `../KNOWN-webapp` (repo `potat4190/KNOWN`, Pages from `main` `/`, base path `/KNOWN`, `.nojekyll`, `404.html` = `index.html` for deep links). Storage is `localStorage`, **not encrypted**; by team decision the website shows no extra notice about it (it matches the phone).

**What was wrong with the live site (2026-10-04):** it still served the old hand-written HTML/JS build. The app-generated export had been copied into the folder but never committed or pushed (so `_expo/` and `404.html` were missing and deep links showed GitHub's 404), and local `main` was 3 commits behind GitHub (a CNAME added and removed in the web UI). Fixed by committing and pushing the export (`51e955a`). Latest site build: `e6b25d8`.

**Web-only adapters** (`*.web.ts(x)`, phones never load them): `sql-store.web.ts`, `kv.web.ts`, `Sheet.web.tsx`, `direction.web.ts`, `a11y-focus.web.ts`, plus (2026-10-04) `youversion-web.web.ts` (keeps the browser's fetch and the page height; the SDK's components are made for phone WebViews and broke both), `BibleVersionSheet.web.tsx` (the SDK's picker sheet renders nothing in browsers), `Rise.web.tsx` (Reanimated's web layout animations pinned every screen section with `position: absolute`, so growing content overlapped) and `AppFrame.web.tsx` (a centred 560 px column on wide windows). The app entry is now `index.ts` (Expo Router's documented custom entry) so the fetch guard loads before the SDK.

**Walked on the live site (headless Edge, 2026-10-04/05):**

| Checked | Result |
|---|---|
| Golden path (language → cards → Home → Feel → Scripture → Pray → After → Keep → Save → Done → Moments → Moment → Settings), English, 390×844, light and dark, YouVersion | Works; YouVersion text, label, copyright on the card (BSB since `e6b25d8`); saved to localStorage; no console errors. |
| Same, Arabic, 390×844, light | Works; `<html dir="rtl">`, YouVersion 195 text, label ت ع م, copyright; reference reads نحميا 1:2–4. |
| Same, Burmese, 390×844, dark | Works; bundled Judson with Burmese digits, no YouVersion pill (no version for Burmese). |
| Same, English, 1366×900, light and dark | Works; the app sits in a centred phone-width column (since `e6b25d8`). |
| "Open in YouVersion" → reader (Nehemiah 1) | Works. |
| Settings → Bible version → picker → BSB → next card in BSB | Works (local build of the same code; the live picker was not re-run, to spare the rate limit). |
| Own words: crisis phrase → Crisis → Help; continue to Scripture | Works. |
| Own words, on-device match → Nehemiah ("Matched on this phone") | Works. |
| Doesn't fit after editing the prayer → asks → swaps | Works. |
| ✕ → Save this step for later → Paused → reopen the site → Recover (Escape doesn't close it) → Continue | Works. (A browser reload while on `/paused` shows Paused again, as the URL is kept; the phone always relaunches at Home.) |
| Sit; Reach out (no relay: copy, no Translate) | Works. |
| Judge panel: on → tab → panel → fast-forward (4 days) → reset → off (clock back to 0) | Works. |
| Moment detail → delete; Settings → Delete everything (keeps language) | Works. |
| Deep link `/KNOWN/moments` | Works (Pages answers 404 with the app, so the console shows one expected 404). |
| YouVersion from the browser (CORS) | api.youversion.com allows any origin; no relay proxy needed. |

Not checked on the web: real phones, Safari/iOS, Firefox; screen readers in browsers.

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

Found and fixed on the way (2026-10-04): the web issues above (YouVersion fetch loop and page height, missing web picker, overlapping sections, stretched desktop layout); her Bible version choice followed her across app languages (now per language, `6b85ff4`).

## Device runs

### Android emulator, 2026-10-04/05

**Local release build** (x86_64 APK from commit `6ece1d1`, so English was still WEBUS there; built in `E:\KNOWN-build\repo` with `gradlew assembleRelease --offline -PreactNativeArchitectures=x86_64`): cold start to the language screen in ~8 s; the first Scripture card showed YouVersion text within 1 s (Nehemiah 1:4); Hagar card with YouVersion text; "Open in YouVersion" → reader (Nehemiah 1); Settings → picker with the full version list; switching to Arabic restarted the app right-to-left (via expo-updates). No errors seen.

**Dev build** (JS from Metro):

| Checked | Result |
|---|---|
| Scripture card with YouVersion text, label, copyright (Ruth 1:16 WEBUS; Psalm 13:1–2, 5 WEBUS; Psalm 142:4–5 BSB) | Works, but slowly the first time (see "Known issues"). |
| "Open in YouVersion" → reader in the same version (Nehemiah 1, WEBUS) | Works. |
| Settings → Bible version picker → BSB → next card in BSB | Works. |
| Offline (airplane mode) → bundled WEBBE, pill "Open in YouVersion (BSB)" | Works. |
| Tips: first-visit tip; not back after leaving without "Got it"; Scripture tip only when its target is visible; Continue never covered | Works. |
| Keep → Finish without saving after editing the prayer → asks; Cancel returns | Works. |
| Arabic: restart right-to-left, reference reads نحميا 1:2–4, label ت ع م and copyright | Works; the verse text did not appear within ~25 s in that dev run (dev-only, see "Known issues"). |

### Android emulator, 2026-10-03 (dev build)

Language → cards → Home; Feel → Nehemiah 1 (WEBBE); Psalm 142; Pray; Keep/Done save-once; Settings; coach-mark fixes; SerifGate; ✕ → Paused; judge panel fast-forward; rotation. All worked (details in git history of this file).

## YouVersion (chosen 2026-10-04)

`src/config/bible-versions.ts`: en **3034 BSB**, ja **81 JA1955**, zh **43 CSBS**, ar **195 SAT**, my none (bundled Judson). Every library passage was fetched live in each version and verse numbering matches the bundled editions.

- English: BSB (public domain) says "the LORD" like the bundled WEBBE, with different wording; its Psalms include the title ("For the choirmaster…") in verse 1. 206 WEBUS (WEBBE's own translation) was set first and replaced because it says "Yahweh" (team decision).
- JA1955 has no copyright string in the API, so its card shows the label only.
- CSBS (© Global Bible Initiative) and 195 SAT (© 2016 Bible League International) are different translations from the bundled 和合本 and Van Dyck, which YouVersion doesn't offer for this key.
- Her Settings choice is kept per app language (`prefs.yvVersions`); an older saved single choice becomes the choice for the language she used.

## Known issues and risks

- **YouVersion rate limit.** After heavy testing the key got `429 Rate limit exceeded` (`Retry-After: 300`) for ~25 minutes, and later one burst was refused. The key is public in the website's JavaScript, so every visitor shares it. Opening the reader costs ~15 API calls. When limited, the app's preflight falls back to the bundled text (correct), but if the limit hits after the preflight the SDK's text view shows its own error in the card. Don't hammer the key before the demo.
- **Android dev build only:** each SDK WebView loads its code from Metro, so the first YouVersion card can take 10–20 s, and Expo's DOM bridge logs `DomWebView.injectJavaScript has been rejected … Unable to find view with tag` (a LogBox toast, which can also swallow taps near the bottom of the screen). Not seen in the release build, where the text appears within a second. Demo a release/preview build, not the dev client.
- Web, Burmese at 390 px: the wider Help pill overlaps the last step dot in the session header.
- Native Fabric SIGSEGV seen twice on 2026-10-03 (not reproduced since).

## Not verified

- TalkBack/VoiceOver focus after the `findNodeHandle` replacement.
- The storage-failure path on a real device (unit-tested only).
- Double taps on a device (unit-tested only).
- iOS, Safari, real Android phones, EAS builds.
- The full Maestro `e2e/` suite (only ad-hoc flows were run).
- A release build containing the last three commits (`6b85ff4` BSB and per-language choice, `b68f773` web column): the release APK was built from `6ece1d1`.

## Waiting on people

| What | Who | Where |
|---|---|---|
| Default AI provider for the relay (Gloo or Claude) | Team | `relay/wrangler.toml` `AI_PROVIDER` |
| Which build is demoed Oct 6–8 (a release/preview build is recommended over the dev client) | Team | — |
| Deploy the relay + set `EXPO_PUBLIC_AI_RELAY_URL` | Team | `relay/README.md` |
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
