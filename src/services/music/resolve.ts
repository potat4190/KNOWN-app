/**
 * Which track plays (brief 8.5): byPath[path][moment] → bySelection[sel][moment]
 * → moments[moment] → silence. Pure.
 */
import { MUSIC, type MusicConfig, type MusicMoment, type Track } from '@/config/music';

export function resolveTrack(
  moment: MusicMoment,
  o: { path?: string | null; sel?: string | null },
  cfg: MusicConfig = MUSIC,
): Track | null {
  if (o.path && cfg.byPath[o.path]?.[moment] != null) return cfg.byPath[o.path][moment] ?? null;
  if (o.sel && cfg.bySelection[o.sel]?.[moment] != null) return cfg.bySelection[o.sel][moment] ?? null;
  return cfg.moments[moment] ?? null;
}

/** Any track configured at all (the Settings switch appears only then). */
export function anyMusicConfigured(cfg: MusicConfig = MUSIC): boolean {
  const vals = [
    ...Object.values(cfg.moments),
    ...Object.values(cfg.bySelection).flatMap((m) => Object.values(m)),
    ...Object.values(cfg.byPath).flatMap((m) => Object.values(m)),
  ];
  return vals.some((v) => v != null);
}

/** Volume steps for a fade (expo-audio has no fade API, so the controller steps volume on a timer). */
export function fadeSteps(from: number, to: number, ms: number, stepMs = 100): number[] {
  const n = Math.max(1, Math.round(ms / stepMs));
  return Array.from({ length: n }, (_, i) => +(from + ((to - from) * (i + 1)) / n).toFixed(4));
}
