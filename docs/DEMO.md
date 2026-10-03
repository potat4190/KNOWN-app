# The 90-second demo (Milestone A)

From the judges' critique. Each beat maps to one of the Bible track's five tests. The judge panel (Settings → Judge panel, then the edge tab) sets up any beat in one tap.

| Time | Test | What happens | Panel shortcut |
|---|---|---|---|
| 0:00–0:10 | **Need** | "Esther, a student from Myanmar, hasn't heard from her family since the news from home." App language: Burmese (မြန်မာ). | Golden path **1 Welcome** |
| 0:10–0:35 | **Encounter, with visible AI** | Begin → the Fear picture (a figure in a dark hallway, holding a phone) → Continue → **Nehemiah 1** (the first Fear pick on a device is Nehemiah; later picks rotate, so **Clear data** before going on stage). *Or*: My own words, type "I can't reach my family" in Burmese → Find a story → "You said" + the AI's one-line reason → Nehemiah 1. The card names its edition; with a YouVersion version configured and online it comes from YouVersion, otherwise the bundled Judson text. | **2 Pictures** / **3 Types in own words** / **4 Nehemiah 1** |
| 0:35–0:50 | **Response** | Tap a say-line: it appears in the prayer card. Edit one line of the prayer. Amen. | **5 Prayer** |
| 0:50–1:05 | **Continuation** | Reach out → My community guide → They read: English → Translate (shows the translation and a back-translation in Burmese) → Copy or Share…. Keep this message → back → Keep → Save to Moments. | **6 Before you go**, **7 Reach out**, **8 Kept** |
| 1:05–1:15 | **Safety** | Begin a second moment, tap ✕ → Save this step for later. Panel → Fast-forward 4 days and reopen → the paused moment is gone and Home shows "A paused moment was removed after 3 days." once. **Reset clock.** | Clock and privacy |
| 1:15–1:30 | **Validation** | "We tested with … students. They told us …, so we changed …." The panel's Bible-track section shows the team's findings (`src/config/bible-track.ts`). Ask: pilot through IFI friendship partners. | Bible track · five tests |

## Honest notes for this demo

- **Burmese from YouVersion is not possible with the current key**: the API returns no Burmese versions (checked 2026-10-03, `npm run yv:versions`). The Burmese demo shows the bundled Judson (1835) text, labelled "Judson". Say so if asked: "YouVersion is our Scripture layer; where it has no version in her language, KNOWN shows a public-domain edition offline."
- The **AI beat needs the relay deployed** (`relay/README.md`) and `EXPO_PUBLIC_AI_RELAY_URL` set. Without it, own words still work through the on-device matcher, the card shows "Matched on this phone", and Translate is replaced by the copy-only note. For a guaranteed AI moment on stage, use the deployed relay with venue Wi-Fi; the on-device matcher is the backup.
- The demo text in the panel's golden path is English ("I can’t reach my family anymore, and I’m scared watching the news about my country."); type the Burmese line live if the relay is up.

## Pre-stage checklist

- [ ] Judge panel → **Reset clock** (the tab turns red while the clock is offset).
- [ ] Judge panel → **Clear data** (no leftover Moments or paused moment, and the story rotation resets so Fear opens Nehemiah).
- [ ] App language set to Burmese; appearance as rehearsed.
- [ ] Turn the Judge panel **off** in Settings for the student view (no trace of it remains).
- [ ] Relay health: `curl $EXPO_PUBLIC_AI_RELAY_URL/health` → `{"ok":true}`.
- [ ] Airplane-mode backup: pictures, Scripture (bundled), prayer, Keep and Moments all work offline. Rehearse once in airplane mode.
- [ ] A screen recording of the full path as a fallback video.
- [ ] Phone: Do Not Disturb on, brightness up, volume as wanted (music only if a track is configured).
