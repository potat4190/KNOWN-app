/**
 * One shared player (expo-audio createAudioPlayer). Fades in and out by
 * stepping volume on a timer; loops; a missing or failed track is silence,
 * never a crash. Audio mode respects the silent switch and mixes with her own audio.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { MUSIC, type Track } from '@/config/music';
import { fadeSteps } from './resolve';

const STEP_MS = 100;

export class MusicController {
  private player: AudioPlayer | null = null;
  private current: Track | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private modeSet = false;

  private async ensureMode() {
    if (this.modeSet) return;
    this.modeSet = true;
    try {
      await setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      });
    } catch {
      // Silence is fine.
    }
  }

  private fade(to: number, ms: number, done?: () => void) {
    if (this.timer) clearInterval(this.timer);
    const p = this.player;
    if (!p) return done?.();
    const steps = fadeSteps(p.volume ?? 0, to, ms, STEP_MS);
    let i = 0;
    this.timer = setInterval(() => {
      try {
        p.volume = steps[i++];
      } catch {
        // Player released.
      }
      if (i >= steps.length) {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        done?.();
      }
    }, STEP_MS);
  }

  async play(track: Track) {
    if (this.current === track && this.player?.playing) return;
    await this.ensureMode();
    try {
      const source = typeof track === 'string' ? { uri: track } : track;
      if (!this.player) this.player = createAudioPlayer(source);
      else this.player.replace(source);
      this.current = track;
      this.player.loop = MUSIC.loop;
      this.player.volume = 0;
      this.player.play();
      this.fade(MUSIC.volume, MUSIC.fadeInMs);
    } catch {
      this.current = null;
    }
  }

  stop() {
    if (!this.player || !this.current) return;
    this.current = null;
    this.fade(0, MUSIC.fadeOutMs, () => {
      try {
        this.player?.pause();
      } catch {
        // ignore
      }
    });
  }

  release() {
    if (this.timer) clearInterval(this.timer);
    try {
      this.player?.remove();
    } catch {
      // ignore
    }
    this.player = null;
    this.current = null;
  }
}

export const music = new MusicController();
