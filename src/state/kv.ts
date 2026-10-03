/**
 * Small key-value storage for preferences (MMKV). Nothing sensitive lives here:
 * no moments, no words, no rotation state (those are in the encrypted DB).
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';

let instance: MMKV | null = null;
const mmkv = () => (instance ??= createMMKV({ id: 'known.prefs' }));

export const kv = {
  getJSON<T>(key: string): T | null {
    try {
      const s = mmkv().getString(key);
      return s ? (JSON.parse(s) as T) : null;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown) {
    mmkv().set(key, JSON.stringify(value));
  },
  remove(key: string) {
    mmkv().remove(key);
  },
};
