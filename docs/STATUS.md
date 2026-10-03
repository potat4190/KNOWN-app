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
| 9 Hardening | Not started: Maestro flows, QA doc, accessibility pass on devices. |

Tests: `npm test` = content validator + 287 Jest tests (app + relay), all passing. `npm run typecheck` and `npm run lint` are clean.

## Native build (not verified yet)

- A local Android debug build was attempted on this PC. It failed first on a missing JDK 17 toolchain (React Native's Gradle plugin needs JDK 17; this PC has 8/16/21/24/25/26), then, with JDK 17, **the C: drive ran out of space** while Gradle installed the NDK (≈4.4 GB). The build outputs, the NDK and the downloaded JDK were removed again to free space; nothing else was touched. About 12 GB is free now; a local Android build needs roughly 10 GB more (NDK + build cache).
- **Recommended:** build in the cloud with EAS (needs `npx eas-cli@latest login` with the team's Expo account), then install the dev client on a phone:
  ```bash
  npx eas-cli@latest build --profile development --platform android
  npx eas-cli@latest build --profile development --platform ios   # needs an Apple developer account
  ```
- So far nothing has been run on a real phone or emulator. Treat device behaviour (SQLCipher, MMKV, YouVersion DOM components, RTL reload, fonts, tips placement) as unverified until then.

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
