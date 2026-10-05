# Decisions

Choices made while building, with the reason. Open team decisions (brief 18.2) are listed at the end; nothing there is decided silently.

## Already answered by the team (brief 18.1)

| # | Decision | Built as |
|---|---|---|
| 1 | YouVersion app key | Key in `.env` (`EXPO_PUBLIC_YOUVERSION_APP_KEY`). Bundled Scripture first (phase 2), YouVersion second (phase 3). Every Jest test mocks YouVersion. A missing or rejected key is recorded in `docs/STATUS.md`; the bundled text keeps working. |
| 2 | Paused moments: the 3-day rule | Saved only when she taps "Save this step for later". No autosave. The session is **not** wiped when the app goes to the background (she may be in the share sheet or on a call). Limit lives in one constant, `PAUSE_TTL_MS` in `src/config/privacy.ts`. **Privacy review by Kezia and Dorcas is still pending.** Note: the reviewed copy `exit_save_d` and `paused_sub` say "3 days" in words, so if the constant changes, that copy must change in the same commit. |
| 3 | AI relay: build it, never depend on it | Worker + tests in `relay/`. With `EXPO_PUBLIC_AI_RELAY_URL` empty the app ships and works: own words → on-device matcher; translate → copy-only (`tr_off`). Provider keys live only in Worker secrets. "My own words" sits behind `FLAGS.ownWords` (default on). |
| 4 | Mode screen off the main path | Begin goes straight to Feel. "With someone I trust" is a quiet link on Home → Guided orientation → Feel. The outline lists the Mode screen as screen 3; the Design Lab skipped it and the critique rates it "Won't" because it adds a tap for everyone. Restoring it is one route. |

## Made while building

| Date | Decision | Why |
|---|---|---|
| 2026-10-03 | The repo root is the `KNOWN/` folder (the brief's `known/`). Reference files renamed to the brief's names (`KNOWN_Design_Lab.html`, `KNOWN_app_build_outline_and_flowchart.docx`) and stored byte-exact (`.gitattributes: reference/** -text`). | The brief's paths and the extraction script expect these names. |
| 2026-10-03 | Expo SDK 56.0.23, React Native 0.85.3, React 19.2.3, TypeScript 6. `react-native-nitro-modules` pinned to `~0.36.5` and `react-native-mmkv` `^4.3.2`. | YouVersion SDK 1.6.0 needs `expo >=56 <57`; its core needs nitro `>=0.35 <0.37` and MMKV 4. `npx expo install` chose every Expo-managed version. |
| 2026-10-03 | i18next 26.3 / react-i18next 17.0 / zustand 5.0 match the versions the YouVersion SDK depends on. | One copy of each library in the bundle. |
| 2026-10-03 | Routes live in `app/` at the repo root (as in the brief's layout), not the template's `src/app/`. Template demo screens, logos and its MIT licence were removed. | Brief section 4 and 18.2 #9 (licence is the team's call). |
| 2026-10-03 | `src/content/` is generated; typed accessors live in `src/lib/content.ts`. The extraction also writes `matcher-rules.ts` (the regexes lifted verbatim from `AI.local()`), `steps.json` (step dots and step names), `panel.json` (EMO, demo text, prototype YouVersion guesses: panel only) and `prototype-prompts.json` (for the relay port). | Port the spec programmatically, never by retyping. |
| 2026-10-03 | `rotation.json` survives re-extraction; `build-rotation.ts` writes it only when missing or with `--reset`. | The brief says the team edits pools as plain data. |
| 2026-10-03 | Content overrides support `paths.*.<key>…`, `strings.<lang|*>.<key>`, `bridges.…` and global files (`storyChapters.<key>`). Applied overrides (with the previous value) are written to `src/content/overrides.applied.json` for the panel and `CONTENT_REVIEW.md`. | Brief 2.4. |
| 2026-10-03 | **Emotion-word check scope.** Hard failure for UI strings, drafted strings, bridges and breath lines. Story copy (`frame`, `intro`, `story`) describes a person in Scripture, and `options`/`prayer` are her own editable voice, so hits there are reported, not failed. | Boundary 1 is about the app naming *her* emotion. |
| 2026-10-03 | **Three reviewed bridge lines name her emotion** (`SF.h` en/ar "afraid / خائف", `FJ.h` en "part of you is afraid"). Not changed; allow-listed in the validator as review items for Dorcas and printed on every run. | Never rewrite reviewed copy; never hide a boundary question either. |
| 2026-10-03 | Final-verse truncation check allows Neh 1:4 (its sentence continues into 1:5) and Van Dyck Arabic (no final punctuation). | Both are true to the editions. |
| 2026-10-03 | Plurals: reviewed `removes_1`/`removes_n`/`removes_in` become i18next plural forms; only missing forms are drafted (English `removes_in_one`; Arabic two/many/other forms in the existing "خلال" wording). | Brief 8.7, without rewriting reviewed text. |
| 2026-10-03 | New strings live in `src/i18n/drafted.ts` (`drafted = true`), never in `src/content/`. Reviewed content always wins over a drafted key. | Brief 0.3. |
| 2026-10-03 | Bundle ids are provisional: `org.ifiusa.known(.dev/.preview)`. | Publisher accounts are open (18.2 #12). |
| 2026-10-03 | `bible-versions.ts` maps every language to `null` until the team confirms ids from `npm run yv:versions`. While null, the bundled edition is shown and "Open in YouVersion" is hidden rather than pointing at an unverified version. | Brief 8.3: the label must match what opens, and the prototype's ids are partly wrong. |
| 2026-10-03 | `Help` numbers are rendered only from `src/config/help-lines.ts`. The local emergency line for her region is shown only when that entry is verified; otherwise the generic `help_local` text is shown. 988/911 are shown under "These services are for the United States" (as in the Design Lab) while Kezia verifies them. | Never guess a number. |
| 2026-10-03 | Coach marks: Feel (tabs, "I don't have the words"), Scripture (full passage, doesn't fit), Pray (lines, editable prayer), After (the three choices **and** the ✕ tip), Moments (first row). The ✕ tip moves to After because Feel already has its two. Tips never cover the header (Help pill) or the bottom actions (primary button): the scrim is limited to the content area and never takes touches. | Brief 8.4: at most 2 per screen, never block Help. |
| 2026-10-03 | One music flag: the speaker button on Pray/Sit and Settings → Background music share `musicOn`. The Settings switch only appears once a track is configured. | Simpler for her; no control that does nothing. |
| 2026-10-03 | Delete everything keeps the language **and** `tourDone`, so the first-run cards don't return uninvited; tips state resets. | Brief 8.9 + 8.4 ("cards never return except from Settings"). |
| 2026-10-03 | **Supplementary crisis phrases** (`src/config/crisis-extra.ts`, drafted for Kezia) are OR'd with the reviewed regex. The reviewed regex missed 18 of 25 crisis test phrases (e.g. 我想死, もう生きていたくない, "ending my life", threats). | A miss could skip the Crisis screen; a false positive only shows it first. |
| 2026-10-03 | Save once: Keep pushes Done (not replace), so Back from Done returns to Keep, which shows "Saved to Moments on this phone." `savedMomentId` blocks a second save. | Brief 7 (Keep). |
| 2026-10-03 | Moments store `stayIndex` and `prayerEdited` in addition to the brief's fields, so translate-on-open can re-render the say-line and an unedited prayer while never touching her own words. | Brief 7 (translate-on-open). |
| 2026-10-03 | The relay uses the official `@anthropic-ai/sdk` in the Worker; the Gloo adapter is plain `fetch` (OpenAI-compatible). Default model `claude-haiku-4-5-20251001` as the brief names; override with `ANTHROPIC_MODEL`. | Brief 10. |
| 2026-10-03 | The judge panel's **Clear data** also resets story rotation, so Fear opens Nehemiah first again on stage. | Demo safety (rotation would otherwise change the stage pick after rehearsals). |
| 2026-10-03 | Tests: Jest projects `app` (jest-expo) and `relay` (Node). RNTL 13 (expo-router's `renderRouter` targets it). Native modules (MMKV, Reanimated/Worklets, YouVersion components, audio, network) are mocked; YouVersion's real design tokens are read from the SDK's theme files. | Unit tests never call the network. |
| 2026-10-03 | Local Android builds need **JDK 17** (React Native's Gradle plugin toolchain) and ~10 GB free disk. EAS cloud builds are the recommended path. | See STATUS (native build). |
| 2026-10-04 | **YouVersion versions chosen by Rhidaya**: en 206 WEBUS, ja 81 JA1955, zh 43 CSBS, ar 195; Burmese none (bundled Judson). Replaces the all-`null` mapping above. | From `npm run yv:versions`; every library passage checked live in each version. |
| 2026-10-04 | The website is the app's own `expo export --platform web` (no hand-written copy). Browser differences live only in `*.web.ts(x)` adapters; bug fixes go in shared code. | The web must match the phone; one codebase. |
| 2026-10-04 | Web: `youversion-web.web.ts` keeps the browser's own `fetch` (the SDK replaces it to route Bible requests to the phone side, which loops in a browser) and pins the page height (the SDK's text view sets `html, body, #root { height: auto }`). It must load before anything imports the SDK, so the app entry is `index.ts` (Expo Router's documented custom entry). | api.youversion.com allows browser requests (CORS `*`), so no relay proxy is needed. |
| 2026-10-04 | Web: Settings → Bible version uses `BibleVersionSheet.web.tsx`, the SDK's own browser picker components in a sheet drawn like the SDK's, with YouVersion's header strings (English fallback for Japanese and Burmese, as the SDK does on phones). | The SDK's sheet returns null in browsers; a row that does nothing breaks "every control works or isn't shown". |
| 2026-10-04 | Web: `Rise.web.tsx` plays the screen entrance as a CSS animation. | Reanimated 4.3's web layout animations pin custom entering animations with `position: absolute`. |
| 2026-10-04 | Tips count as seen once she leaves a screen where they were shown; content targets get a tip only while in view; header/actions targets are `fixed`. | No tip has to be tapped away; a ring never lands on the primary button. Count and copy unchanged. |
| 2026-10-04 | `Store.persistent`. A freshly made key that can't open `known.db` means the old file can never be read: it is deleted and recreated. A key that exists but fails never deletes anything; the app says honestly that nothing survives closing. | Handoff: "recreate the DB when the key is missing; otherwise tell her honestly". |
| 2026-10-04 | The judge panel's clock offset counts only while the panel is on; switching the panel off resets it. | "Off = the clean student version, with no trace of the panel." |

## Still open (brief 18.2): asked, not decided

**Needed before Milestone A ends**
1. YouVersion version ids per language (after `npm run yv:versions` with the real key).
2. Default AI provider for the relay: Gloo AI Studio or the Claude API. Both adapters are built.
3. Which build is demoed on October 6–8: this app, or the Design Lab web prototype.

**Can wait**
4. Rotation pools (defaults from 8.2 are built).
5. Music default (on when a track is configured is built).
6. Figma flow's "Which of these is closest?" step: not built unless asked.
7. No-words psalm: Psalm 77 (built, paired with a Help link) or Psalm 139.
8. UI font: Inter (built) or Atkinson Hyperlegible (one token: `theme/fonts.ts`).
9. Licence for the code (`LICENSE-PENDING.md` until then).
10. Out of scope unless asked: reminders, companion invite/card, bilingual reach-out variants, extra psalm alternates, feedback sliders.
11. Name collision: Figma companion "Hannah" vs the Hannah pathway.
12. Publisher accounts (Apple, Google) and the bundle id.
