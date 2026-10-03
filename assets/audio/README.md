# Background music

Music is added by the team in code, never by users and never generated. It plays gently on the **Pray** and **Sit a little longer** screens (and on Scripture only if you configure it).

## Add a track (3 steps)

1. Drop an mp3 in this folder, for example `assets/audio/pray-piano.mp3`, and record its title, artist and licence in `CREDITS.md`. Only use music the team has the rights to.
2. Add one `require()` line in `src/config/music.ts`:
   ```ts
   moments: {
     pray: require('../../assets/audio/pray-piano.mp3'),
     sit: null,
     scripture: null,
   },
   ```
   You can also set a track per picture selection (`bySelection: { S: { pray: require(...) } }`) or per story (`byPath: { ruth: { sit: ... } }`). Resolution order: story → selection → moment → silence.
3. Rebuild the app (`npm run android` / `npm run ios`, or an EAS build).

A remote `https://` URL works without rebuilding assets, but needs network. A missing or broken track is silence, never a crash.

She can mute it with the speaker button on Pray and Sit, or turn it off in Settings → Background music. The Settings switch only appears once at least one track is configured.
