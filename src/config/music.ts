/**
 * THE place the team adds background music (brief section 8.5).
 * Music is added here in code, never by users and never generated.
 *
 * To add a track:
 *   1. Drop an mp3 in assets/audio/ (and record it in assets/audio/CREDITS.md).
 *   2. Add one require() line below, e.g. pray: require('../../assets/audio/pray-piano.mp3').
 *   3. Rebuild the app.
 * Remote https URLs also work without rebuilding assets, but need network.
 *
 * Resolution: byPath[path][moment] → bySelection[sel][moment] → moments[moment] → silence.
 * A missing or failed track is silence, never a crash.
 */
export type Track = number /* require('…mp3') */ | string; /* https URL */
export type MusicMoment = 'pray' | 'sit' | 'scripture';
type MomentTracks = Partial<Record<MusicMoment, Track | null>>;

export type MusicConfig = {
  enabledByDefault: boolean;
  volume: number;
  fadeInMs: number;
  fadeOutMs: number;
  loop: boolean;
  moments: Record<MusicMoment, Track | null>;
  bySelection: Record<string, MomentTracks>;
  byPath: Record<string, MomentTracks>;
};

export const MUSIC = {
  enabledByDefault: true,
  volume: 0.35, // gentle
  fadeInMs: 2500,
  fadeOutMs: 1500,
  loop: true,
  moments: {
    // default track per moment; null = silence
    pray: null, // e.g. require('../../assets/audio/pray-piano.mp3')
    sit: null, // e.g. require('../../assets/audio/breath-strings.mp3')
    scripture: null, // off by default
  },
  bySelection: {}, // optional per picture selection: { S: { pray: require(...) } }
  byPath: {}, // optional per story: { ruth: { sit: 'https://cdn.example.org/ruth.mp3' } }
} satisfies MusicConfig as MusicConfig;
