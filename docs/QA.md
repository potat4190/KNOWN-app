# Manual QA checklist

Run on a development build (`docs/STATUS.md`). Tick each cell for **iOS** and **Android**. Not yet run on any device.

## Matrix

| Check | iOS | Android |
|---|---|---|
| Light appearance | | |
| Dark appearance | | |
| Largest text size (Dynamic Type / Font size max): no clipped text, buttons still reachable | | |
| VoiceOver / TalkBack: the main flow (Begin → picture → Continue → Scripture → Pray → Amen → Keep → Save) | | |
| Airplane mode: pictures, bundled Scripture, prayer, Keep, Moments all work; own words falls back on the phone; Translate shows the copy-only note | | |
| No YouVersion key (`EXPO_PUBLIC_YOUVERSION_APP_KEY` empty): bundled text, edition named, no YouVersion pill, no Bible-version setting | | |
| Arabic: confirm-then-reload into right-to-left; chevrons mirrored; English fallback passages read left-to-right with the note | | |
| Burmese: Noto Sans Myanmar renders; digits in counts and references are Burmese | | |

## Per screen

- [ ] Help is one tap away on every screen (except Help itself); no tips or music on Crisis or Help.
- [ ] One primary button per screen; "Finish for now" is never primary.
- [ ] Every control works or isn't shown (Translate only with a relay; Bible version only with a working key; music switch only with a track).
- [ ] The chosen say-line appears in the prayer card, and in the kept Moment.
- [ ] Doesn't fit: person story once, laments not yet seen, "Choose different pictures"; asks before replacing an edited prayer.
- [ ] ✕ → End without saving asks first when she typed or edited anything.
- [ ] Keep: Save disabled when nothing is checked; "My message" only after "Keep this message"; Back from Done shows "Saved"; no second Moment.
- [ ] Home shows only a count of Moments, never titles, Scripture or her words.
- [ ] App switcher shows the lamp cover, not her words.
- [ ] Pause → reopen → Recover sheet (can't be swiped away) → Continue restores the step; Start a new one deletes it.
- [ ] Judge panel: Fast-forward 4 days → paused moment gone, one-time notice; Reset clock; the tab turns red while the clock is offset.
- [ ] Delete everything (Settings and the ✕ sheet): Moments, paused moment, rotation, tips, music setting and clock are gone; language stays.
- [ ] Reduce Motion on: no rising entrances, no glow animation, the breathing lamp is still, both breath lines show.
- [ ] Focus moves to each screen's heading; status lines are announced; 44-pt targets; visible focus ring (keyboard / switch control).
- [ ] Moment detail in another language: asks to switch; Yes re-renders Scripture, title and the say-line; her own words unchanged.

## Contrast (WCAG AA)

Text colours come from YouVersion's tokens (`#121212` / `#636161` on `#ffffff`; `#ffffff` / `#edebeb` on `#121212`). The lamp accent is used for rings, dots and glow, not small text; small amber text uses lamp ink (`#8A5418` light, `#F6C47E` dark). Spot-check with a contrast tool on both themes.
