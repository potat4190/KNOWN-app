# KNOWN

An in-the-moment Scripture experience for someone carrying something they can't put into words. She names what feels closest, meets a person in Scripture who carried something similar, reads the actual Scripture, prays, then chooses what to do next. Empathy first, then prayer.

React Native + Expo SDK 56, TypeScript strict. Built from the team's reviewed web prototype (`reference/KNOWN_Design_Lab.html`) for the 2026 Gloo AI Hackathon, Bible track.

> Status: see `docs/STATUS.md`. Decisions: `docs/DECISIONS.md`. Content waiting for review: `docs/CONTENT_REVIEW.md`.

## Setup

Requirements: Node 22+, and for native builds either EAS (cloud) or Android Studio / Xcode locally. **Expo Go can't run KNOWN**: the YouVersion SDK and SQLCipher need a development build.

```bash
npm install
cp .env.example .env        # then fill in the values below
npm run content:extract     # regenerate src/content from the Design Lab (already committed)
npm test                    # content validator + unit tests
npm run android             # local dev build on an Android device/emulator (or: npm run ios on a Mac)
npm start                   # Metro for an installed dev client
```

EAS (recommended for device builds): `npx eas-cli@latest build --profile development --platform android|ios`.

Local native builds need **JDK 17** (React Native's Gradle plugin uses a JDK 17 toolchain; set `JAVA_HOME` to it) and about 10 GB of free disk for the NDK and build cache.

On the build lead's PC the heavy pieces live on `E:\KNOWN-build` (C: is nearly full): `jdk\` (JDK 17), `gradle-home\` (`GRADLE_USER_HOME`), `ndk\` (target of the junction `%LOCALAPPDATA%\Android\Sdk
dk`) and `maestro\` (Maestro CLI). All of it is regenerable; to remove it, delete that folder and the junction.

## Tests

- `npm test`: the content validator, then Jest (`app` project: unit + screen smoke tests with native modules mocked; `relay` project: prompt-contract tests). No test calls the network.
- `npm run typecheck`, `npm run lint`.
- `npm run yv:versions` (`-- --all` for the whole catalog): lists YouVersion versions for the five languages with the app key from `.env`.

## Environment variables (`.env`, never committed)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_YOUVERSION_APP_KEY` | From platform.youversion.com. Without it, the bundled public-domain text is shown. |
| `EXPO_PUBLIC_AI_RELAY_URL` | Optional URL of the relay Worker (`relay/`). Empty = on-device matcher only; Translate shows the copy-only fallback. |
| `EXPO_PUBLIC_SHOW_PANEL_TOGGLE` | `true` shows the Judge panel switch in Settings. `false` for store builds. |
| `APP_VARIANT` | `development` / `preview` / `production` (names, bundle ids). |

AI provider keys (Claude or Gloo) never go in the app or `.env`: they live only in the relay's Worker secrets.

## Content

- `src/content/` is **generated** from the Design Lab by `scripts/extract-design-lab.ts`. Never hand-edit it.
- Team-approved fixes go in `scripts/content-overrides.json` (`drafted` or `approved`), applied at extraction.
- New UI copy goes in `src/i18n/drafted.ts` and is listed in `docs/CONTENT_REVIEW.md` (`npm run content:review`).
- `npm run content:validate` checks languages, emotion words, time-neutral copy, placeholders, Help numbers, a Scripture hash snapshot and rotation pools.

## Adding music

See `assets/audio/README.md`. In short: drop an mp3 in `assets/audio/`, add one `require()` line in `src/config/music.ts`, rebuild.

## Switching the AI provider

See `relay/README.md`. The relay has two adapters behind one interface; set `AI_PROVIDER=anthropic` or `AI_PROVIDER=gloo` in the Worker's environment and put the matching key in its secrets.

## Judge panel

Settings → **Judge panel** turns on a small "Judge panel" tab on the screen edge (demo controls: golden path, clock fast-forward, state, AI activity, matrix). Off = the clean student version, with no trace of the panel. The switch itself appears only when `EXPO_PUBLIC_SHOW_PANEL_TOGGLE=true`.

## Web version (GitHub Pages)

The website is built from this app's own code, so it matches the phone app screen for screen.

```bash
npm run web:export        # builds the web version into ../KNOWN-webapp (served at /KNOWN/)
cd ../KNOWN-webapp && git add -A && git commit -m "Update web build" && git push
```

Only a few `*.web.ts(x)` files differ from the phone, because browsers lack the phone's native modules:
`src/data/sql-store.web.ts` (Moments, paused moment and rotation in localStorage, **not encrypted**),
`src/state/kv.web.ts` (preferences in localStorage), `src/components/Sheet.web.tsx` (bottom sheets),
`src/i18n/direction.web.ts` (right-to-left via `<html dir>`; "restart" reloads the page) and
`src/lib/a11y-focus.web.ts`. The YouVersion app key from `.env` is built into the site's public JavaScript.
