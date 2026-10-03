# Privacy, in plain language

KNOWN is for students who may be on a shared phone, or who may face surveillance. These statements describe how the app is built to behave; `docs/STATUS.md` says which parts are implemented and verified so far. If the code changes, this file and the in-app copy (`w_private`, `ai_note`, `tr_note`, `share_note`) change in the same commit.

## What stays on the phone

- **No account.** KNOWN never asks for a name, email or phone number.
- **Nothing is saved unless she chooses.** A Moment is saved only when she taps "Save to Moments", and only the items she checks.
- **Pausing** saves her place only when she taps "Save this step for later". A paused moment is deleted after 3 days (`PAUSE_TTL_MS`). It never turns into a Moment on its own, and its clock never restarts without her action.
- **Encrypted at rest.** Moments, the paused moment and the story-rotation state are stored in an SQLCipher database. Its 256-bit key is generated on first launch and kept in the system keychain/keystore as "this device only, when unlocked", so a backup restored on another device can't read it. Android backups are turned off.
- **Preferences** (language, theme, music on/off, tips) are stored unencrypted in MMKV. They contain nothing she wrote.
- **App switcher:** when KNOWN leaves the foreground, the screen is covered with a plain lamp view so her prayer or words don't show in the app switcher.
- **Delete everything** (Settings, or the ✕ sheet during a moment) wipes Moments, the paused moment, rotation state, tips state, the music setting and the test clock. Only the language choice stays, so the app is still readable.

## What leaves the phone, and only when she chooses

| When | What is sent | To whom | What the app says first |
|---|---|---|---|
| She types in "My own words" and taps Find a story | Her sentence and the app language | The KNOWN relay (a Cloudflare Worker), which forwards it to the AI provider | `ai_note` |
| She taps Translate on a message | The message text and the two languages | The KNOWN relay → the AI provider | `tr_note` |
| Scripture from YouVersion | The Bible reference and version (no personal text) | YouVersion Platform API | Footer names the edition |

- The relay never logs request bodies; it logs counts, latency and errors only. It is rate-limited by IP and by a random install id that is not linked to her identity.
- If the relay isn't configured or can't be reached, her words never leave the phone: the on-device matcher runs instead, and translation is unavailable (copy still works).
- **KNOWN never sends a message for her.** Reach out uses copy or the system share sheet; she sends it herself.

## No tracking

No analytics, no crash reporting that could capture text, no advertising, no streaks or engagement notifications.

## Still to confirm before launch

- Zero data retention for the AI provider: Anthropic (ask the team's org admin) or Gloo AI Studio (its docs don't state retention; ask Gloo and record the answer here).
- The 3-day paused-moment retention is under privacy review (Kezia, Dorcas).
