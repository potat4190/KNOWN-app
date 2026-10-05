/**
 * WEB ONLY (Metro picks this file instead of sql-store.ts when building for
 * the web). Browsers have no SQLCipher or device keychain, so the web build
 * keeps the same data in localStorage. It is NOT encrypted: the web build is
 * for testing, and its banner says so.
 */
import type { Moment, PausedSession, Store } from './types';
import type { RotationEntry } from '@/services/rotation/rotation';

const K = { moments: 'known.web.moments.v1', session: 'known.web.paused.v1', rotation: 'known.web.rotation.v1' };

function read<T>(key: string, fallback: T): T {
  try {
    const s = window.localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function openSqlStore(): Promise<Store> {
  // Fails here (and the app falls back to memory) if the browser blocks storage.
  write('known.web.probe', 1);
  remove('known.web.probe');

  const moments = () => read<Moment[]>(K.moments, []);
  return {
    encrypted: false,
    moments: {
      list: async () => moments().sort((a, b) => b.createdAt - a.createdAt),
      get: async (id) => moments().find((m) => m.id === id) ?? null,
      add: async (m) => write(K.moments, [...moments(), m]),
      remove: async (id) => write(K.moments, moments().filter((m) => m.id !== id)),
      update: async (id, patch) =>
        write(
          K.moments,
          moments().map((m) => (m.id === id ? { ...m, ...patch, id } : m)),
        ),
      count: async () => moments().length,
    },
    session: {
      get: async () => read<PausedSession | null>(K.session, null),
      set: async (s) => write(K.session, s),
      clear: async () => remove(K.session),
    },
    rotation: {
      getAll: async () => read<Record<string, RotationEntry>>(K.rotation, {}),
      put: async (sel, e) => write(K.rotation, { ...read<Record<string, RotationEntry>>(K.rotation, {}), [sel]: e }),
      clear: async () => remove(K.rotation),
    },
    wipe: async () => {
      for (const k of Object.values(K)) remove(k);
    },
  };
}
