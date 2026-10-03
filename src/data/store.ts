/**
 * The app's single Store, opened once at launch (app/_layout.tsx). If the
 * encrypted DB can't open, KNOWN keeps everything in memory only (nothing
 * persists) rather than ever writing her words unencrypted.
 */
import { createMemoryStore } from './memory-store';
import type { Store } from './types';

let current: Store = createMemoryStore();
let opened: Promise<Store> | null = null;

export function getStore(): Store {
  return current;
}

/** Tests inject a memory store. */
export function setStore(s: Store) {
  current = s;
  opened = Promise.resolve(s);
}

export function openStore(): Promise<Store> {
  if (!opened) {
    opened = import('./sql-store')
      .then((m) => m.openSqlStore())
      .then((s) => (current = s))
      .catch((e: unknown) => {
        console.warn('[KNOWN] encrypted store unavailable; keeping data in memory only.', String(e));
        return current;
      });
  }
  return opened;
}
