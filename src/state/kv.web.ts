/**
 * WEB ONLY: preferences in localStorage (the phone app uses MMKV, see kv.ts).
 * Nothing sensitive lives here.
 */
export const kv = {
  getJSON<T>(key: string): T | null {
    try {
      const s = window.localStorage.getItem(key);
      return s ? (JSON.parse(s) as T) : null;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked: keep going without saving */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
