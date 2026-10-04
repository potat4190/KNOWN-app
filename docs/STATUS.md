# Status

Honest state of the build. Updated at the end of every phase. Last update: 2026-10-03.

## Summary

| Phase | State |
|---|---|
| 0 Setup and content | Done. Extraction asserts all pass; validator passes with 16 review items. |
| 1 Foundation | Done in code and unit-tested. **Not yet run on a device** (see "Native build"). |
| 2 Core flow | Done in code; 104 screen smoke tests pass in Jest. **Not yet run on a device.** |
| 3 YouVersion | ScriptureService, fallback, label/link match, Settings picker, in-app reader, version listing script: done and tested (mocked). **Version ids not chosen yet** (needs the team; see below). |
| 4 Rotation | Done (pools, algorithm, bridge rule, persistence, panel section, tests). |
| 5 Music | Config, controller with fades, mute, Settings switch, panel preview, README + CREDITS, tests. **No tracks configured**, so no music plays and the switch is hidden. |
| 6 Onboarding guide | First-run cards, coach marks (TourProvider/TourTarget), Settings controls, drafted strings in 5 languages. Tips not yet verified on a device. |
| 7 Judge panel | Full port + new sections (YouVersion, rotation, music, tour, build, content review), Settings toggle, env gating. |
| 8 Own words and translate | Relay Worker (both providers) + tests + `test-set.jsonl`; app client with 8 s timeout and on-device fallback; translate with back-translation. **Relay not deployed** (team step). |
| 9 Hardening | Maestro flows (`e2e/`, 11 flows) and `docs/QA.md` written; EAS profiles in `eas.json`; `PRIVACY.md` written. **Not run**: needs a device build. The Android JS bundle builds (`npx expo export --platform android`, 9.8 MB Hermes). |

Tests: `npm test` = content validator + 288 Jest tests (app + relay), all passing. `npm run typecheck` and `npm run lint` are clean.

## Device runs (Android emulator, 2026-10-03)

A local Android **debug build succeeded** (Pixel 10 Pro XL emulator, x86_64). The heavy build pieces live on `E:\KNOWN-build` (see README). Walked by hand on the dev build:

| Checked | Result |
|---|---|
| Language → onboarding cards → Home | Works. Noto Sans Myanmar, CJK and Arabic render. |
| Feel → Fear picture → Continue → Nehemiah 1 (WEBBE) | Works; bridge, scene banner, page card, edition label. 3 taps. |
| Sadness picture → Psalm 142 | Works; poetry line breaks render. |
| Pray: chosen line joins the prayer card | Works. |
| After → Keep → Save → Done → Back shows "Saved" (save once) | Works. |
| Settings: Bible-version row appears (YouVersion key works), Judge panel switch → edge tab | Works. |
| Coach marks | Fixed on device: ring was a status-bar height too high; bubble covered the primary button. |
| Headings serif on fast start | Fixed on device (SerifGate). |
| ✕ exit sheet → Save this step for later → Paused | **Fixed on device**: dismissing never-presented sheets fired their onDismiss and closed the open one. Now works. |
| Judge panel → Fast-forward 4 days | Works: the paused moment is deleted; Home shows the one-time notice; the tab turns red while the clock is offset. |
| Story rotation | Works: second Sadness pick → Psalm 13, second Fear pick → Psalm 56, each with the selection's heading and the story's own frame. |

**Known issue (native, intermittent):** two SIGSEGV crashes inside React Native's Fabric renderer (`MountingCoordinator::pullTransaction` at a cold start; `ShadowNode::getTag` during a hot reload). Not reproducible on demand (3 clean cold starts in a row afterwards). Needs watching in release builds; candidates are native mounting hooks (Reanimated / bottom sheet) on RN 0.85.3.

## YouVersion (checked 2026-10-03 with the app key)

The key works (`npm run yv:versions`). Versions enabled for the key, and in the wider catalog (`--all`):

| Lang | Enabled for this key | Also in the catalog | Notes |
|---|---|---|---|
| en | 206 WEBUS, 3034 BSB, 12 ASV, 1207 WMBBE, … (11) | NIV 111, NIVUK 113, NIrV 110, EASY 2079, PEV 2530, … | Bundled is WEBBE; YouVersion has no WEBBE. WEBUS is the same translation in American spelling. |
| my | **none** (API returns 204/500 for `mya`) | none | Burmese stays on the bundled Judson (1835) text. |
| zh | 43 CSBS 中文标准译本, 3354 FEB, 312 CSBT (traditional) | 36 CCB 当代译本 | 和合本 (prototype's 48) is not offered for this key. |
| ja | **81 JA1955 (口語訳 1955)** | 83 JCB | Matches the bundled edition. The prototype's 1819 was wrong. |
| ar | 195 (الترجمة العربية المبسطة) | 101 KEH كتاب الحياة | Van Dyck (prototype's 13) is not offered. |

Until the team picks ids, `src/config/bible-versions.ts` maps every language to `null`, so the bundled text is shown and the "Open in YouVersion" pill is hidden (the label must match what opens).

## Waiting on people

| What | Who | Where |
|---|---|---|
| YouVersion version id per language (see table above) | Team | `src/config/bible-versions.ts` |
| Default AI provider for the relay (Gloo or Claude) | Team | `relay/wrangler.toml` `AI_PROVIDER` |
| Which build is demoed Oct 6–8 | Team | — |
| Deploy the relay + set `EXPO_PUBLIC_AI_RELAY_URL` | Team | `relay/README.md` |
| An EAS (Expo) account login for device builds | Team | — |
| Verify every Help number and link (`verifiedBy`, `verifiedOn`) | Kezia | `src/config/help-lines.ts` (5 entries empty) |
| Review the drafted supplementary crisis phrases | Kezia | `src/config/crisis-extra.ts` |
| Review `relay/test-set.jsonl` (200 drafted sentences, incl. short crisis phrases) | Kezia | `relay/test-set.jsonl` |
| Three reviewed bridge lines that name her emotion | Dorcas | `CONTENT_REVIEW.md` |
| Drafted strings (66 keys × 5 languages) and 3 drafted overrides | Dorcas, Deb, native readers | `CONTENT_REVIEW.md` |
| Paused-moment retention (3 days) privacy review | Kezia, Dorcas | `src/config/privacy.ts` |
| Student findings for the Validation test | Team | `src/config/bible-track.ts` |
| Zero data retention with the AI provider | Team | `docs/PRIVACY.md` |
| Music tracks (optional) and their licences | Team | `src/config/music.ts`, `assets/audio/CREDITS.md` |
| App icon / splash (still Expo placeholders) | Team | `assets/images/` |
