import type { Lang } from '@/i18n/langs';
import type { RotationEntry } from '@/services/rotation/rotation';

export type MomentFrom = 'pics' | 'nw' | 'words';

/** A kept moment. Only the items she checked are filled in. */
export type Moment = {
  id: string;
  kind: 'moment';
  createdAt: number;
  lang: Lang;
  path: string;
  sel: string | null;
  from: MomentFrom;
  /** She kept the Scripture (with reference). */
  passage: boolean;
  scriptureSource: 'youversion' | 'bundled';
  versionId: number | null;
  abbr: string;
  /** "What stayed with me": the say-line text, and its index so it can follow a language switch. */
  stay: string | null;
  stayIndex: number | null;
  prayer: string | null;
  /** False when the prayer is the pathway's own text (so it may be re-rendered in another language). */
  prayerEdited: boolean;
  /** Her own words. Never translated. */
  words: string | null;
  msg: string | null;
};

/** A session she chose to save for later ("Save this step for later"). */
export type PausedSession<S = unknown> = { ts: number; state: S; hist: string[] };

export interface Store {
  readonly encrypted: boolean;
  /** What's saved survives closing KNOWN. False for the memory-only fallback: the app says so. */
  readonly persistent: boolean;
  moments: {
    list(): Promise<Moment[]>;
    get(id: string): Promise<Moment | null>;
    add(m: Moment): Promise<void>;
    remove(id: string): Promise<void>;
    update(id: string, patch: Partial<Moment>): Promise<void>;
    count(): Promise<number>;
  };
  session: {
    get(): Promise<PausedSession | null>;
    set(s: PausedSession): Promise<void>;
    clear(): Promise<void>;
  };
  rotation: {
    getAll(): Promise<Record<string, RotationEntry>>;
    put(sel: string, e: RotationEntry): Promise<void>;
    clear(): Promise<void>;
  };
  /** Delete everything on this phone. */
  wipe(): Promise<void>;
}
