/**
 * In-memory Store: the fallback if the encrypted DB can't open (nothing survives closing
 * KNOWN, and the app says so), and the store tests use (`persistent: true` stands in for a
 * working DB).
 */
import type { Moment, PausedSession, Store } from './types';
import type { RotationEntry } from '@/services/rotation/rotation';

export function createMemoryStore({ persistent = false }: { persistent?: boolean } = {}): Store {
  let moments: Moment[] = [];
  let session: PausedSession | null = null;
  let rotation: Record<string, RotationEntry> = {};
  const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
  return {
    encrypted: false,
    persistent,
    moments: {
      list: async () => clone(moments).sort((a, b) => b.createdAt - a.createdAt),
      get: async (id) => clone(moments.find((m) => m.id === id) ?? null),
      add: async (m) => {
        moments.push(clone(m));
      },
      remove: async (id) => {
        moments = moments.filter((m) => m.id !== id);
      },
      update: async (id, patch) => {
        moments = moments.map((m) => (m.id === id ? { ...m, ...clone(patch) } : m));
      },
      count: async () => moments.length,
    },
    session: {
      get: async () => (session ? clone(session) : null),
      set: async (s) => {
        session = clone(s);
      },
      clear: async () => {
        session = null;
      },
    },
    rotation: {
      getAll: async () => clone(rotation),
      put: async (sel, e) => {
        rotation[sel] = clone(e);
      },
      clear: async () => {
        rotation = {};
      },
    },
    wipe: async () => {
      moments = [];
      session = null;
      rotation = {};
    },
  };
}
