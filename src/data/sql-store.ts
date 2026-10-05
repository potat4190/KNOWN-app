/**
 * The encrypted store: expo-sqlite built with SQLCipher (app.config.ts plugin
 * option useSQLCipher). A 256-bit key is generated on first launch and kept in
 * SecureStore as WHEN_UNLOCKED_THIS_DEVICE_ONLY, so a backup restored on
 * another device can't be read. PRAGMA key runs immediately after opening.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { CONTENT_PACK_VERSION, MIGRATIONS } from './migrations';
import type { Moment, PausedSession, Store } from './types';
import type { RotationEntry } from '@/services/rotation/rotation';
import type { Lang } from '@/i18n/langs';

const DB_NAME = 'known.db';
const KEY_NAME = 'known.db.key.v1';
const SECURE = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

/** The DB key, and whether it was just made (no usable key was in SecureStore). */
async function dbKey(): Promise<{ key: string; fresh: boolean }> {
  const existing = await SecureStore.getItemAsync(KEY_NAME, SECURE);
  if (existing && /^[0-9a-f]{64}$/.test(existing)) return { key: existing, fresh: false };
  const bytes = await Crypto.getRandomBytesAsync(32);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, hex, SECURE);
  return { key: hex, fresh: true };
}

async function openWithKey(key: string): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    // Fails here (not later) if the key doesn't match the file.
    await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master;');
    return db;
  } catch (e) {
    await db.closeAsync().catch(() => {});
    throw e;
  }
}

type Row = {
  id: string;
  created_at: number;
  lang: string;
  path: string;
  sel: string | null;
  from: string;
  passage: number;
  scripture_source: string;
  version_id: number | null;
  abbr: string;
  stay: string | null;
  stay_index: number | null;
  prayer: string | null;
  prayer_edited: number;
  words: string | null;
  msg: string | null;
};

const fromRow = (r: Row): Moment => ({
  id: r.id,
  kind: 'moment',
  createdAt: r.created_at,
  lang: r.lang as Lang,
  path: r.path,
  sel: r.sel,
  from: r.from as Moment['from'],
  passage: !!r.passage,
  scriptureSource: r.scripture_source as Moment['scriptureSource'],
  versionId: r.version_id,
  abbr: r.abbr,
  stay: r.stay,
  stayIndex: r.stay_index,
  prayer: r.prayer,
  prayerEdited: !!r.prayer_edited,
  words: r.words,
  msg: r.msg,
});

const COLS: Record<keyof Moment, string> = {
  id: 'id',
  kind: 'kind',
  createdAt: 'created_at',
  lang: 'lang',
  path: 'path',
  sel: 'sel',
  from: '"from"',
  passage: 'passage',
  scriptureSource: 'scripture_source',
  versionId: 'version_id',
  abbr: 'abbr',
  stay: 'stay',
  stayIndex: 'stay_index',
  prayer: 'prayer',
  prayerEdited: 'prayer_edited',
  words: 'words',
  msg: 'msg',
};
const toSql = (v: unknown): SQLite.SQLiteBindValue =>
  typeof v === 'boolean' ? (v ? 1 : 0) : v == null ? null : (v as string | number);

export async function openSqlStore(): Promise<Store> {
  const { key, fresh } = await dbKey();
  let db: SQLite.SQLiteDatabase;
  try {
    db = await openWithKey(key);
  } catch (e) {
    // The key was gone from SecureStore while the file stayed (a restore, a cleared keychain):
    // that file can never be read again, and every launch would fail on it. Start a new one.
    // A key that exists but doesn't open the file is left alone (the store falls back to memory).
    if (!fresh) throw e;
    await SQLite.deleteDatabaseAsync(DB_NAME);
    db = await openWithKey(key);
  }
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const version = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;'))?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[i]);
      await db.execAsync(`PRAGMA user_version = ${i + 1};`);
    });
  }
  await db.runAsync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?), (?, ?);',
    'schema_version',
    String(MIGRATIONS.length),
    'content_pack_version',
    CONTENT_PACK_VERSION,
  );

  return {
    encrypted: true,
    persistent: true,
    moments: {
      list: async () => (await db.getAllAsync<Row>('SELECT * FROM moments ORDER BY created_at DESC;')).map(fromRow),
      get: async (id) => {
        const r = await db.getFirstAsync<Row>('SELECT * FROM moments WHERE id = ?;', id);
        return r ? fromRow(r) : null;
      },
      add: async (m) => {
        const keys = Object.keys(COLS) as (keyof Moment)[];
        await db.runAsync(
          `INSERT INTO moments (${keys.map((k) => COLS[k]).join(', ')}) VALUES (${keys.map(() => '?').join(', ')});`,
          keys.map((k) => toSql(m[k])),
        );
      },
      remove: async (id) => {
        await db.runAsync('DELETE FROM moments WHERE id = ?;', id);
      },
      update: async (id, patch) => {
        const keys = (Object.keys(patch) as (keyof Moment)[]).filter((k) => k !== 'id');
        if (!keys.length) return;
        await db.runAsync(`UPDATE moments SET ${keys.map((k) => `${COLS[k]} = ?`).join(', ')} WHERE id = ?;`, [
          ...keys.map((k) => toSql(patch[k])),
          id,
        ]);
      },
      count: async () => (await db.getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM moments;'))?.n ?? 0,
    },
    session: {
      get: async () => {
        const r = await db.getFirstAsync<{ ts: number; state: string; hist: string }>(
          'SELECT ts, state, hist FROM session WHERE id = 1;',
        );
        return r ? ({ ts: r.ts, state: JSON.parse(r.state), hist: JSON.parse(r.hist) } as PausedSession) : null;
      },
      set: async (s) => {
        await db.runAsync(
          'INSERT OR REPLACE INTO session (id, ts, state, hist) VALUES (1, ?, ?, ?);',
          s.ts,
          JSON.stringify(s.state),
          JSON.stringify(s.hist),
        );
      },
      clear: async () => {
        await db.runAsync('DELETE FROM session;');
      },
    },
    rotation: {
      getAll: async () => {
        const rows = await db.getAllAsync<{ sel: string; bag: string; last: string | null; count: number }>(
          'SELECT sel, bag, last, count FROM rotation;',
        );
        const out: Record<string, RotationEntry> = {};
        for (const r of rows) out[r.sel] = { bag: JSON.parse(r.bag), last: r.last, count: r.count };
        return out;
      },
      put: async (sel, e) => {
        await db.runAsync(
          'INSERT OR REPLACE INTO rotation (sel, bag, last, count) VALUES (?, ?, ?, ?);',
          sel,
          JSON.stringify(e.bag),
          e.last,
          e.count,
        );
      },
      clear: async () => {
        await db.runAsync('DELETE FROM rotation;');
      },
    },
    wipe: async () => {
      await db.withTransactionAsync(async () => {
        await db.execAsync('DELETE FROM moments; DELETE FROM session; DELETE FROM rotation;');
      });
      // Reclaim freed pages so deleted text doesn't linger in the file.
      await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE); VACUUM;');
    },
  };
}
