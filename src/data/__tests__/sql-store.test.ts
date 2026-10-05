/** The encrypted store recovers from a lost key, and never deletes a file whose key it still has. */
const secure: { key: string | null } = { key: null };
const opened: { failFirst: boolean; opens: number } = { failFirst: false, opens: 0 };

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(async () => secure.key),
  setItemAsync: jest.fn(async (_k: string, v: string) => {
    secure.key = v;
  }),
}));
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn(async () => new Uint8Array(32).fill(7)) }));
jest.mock('expo-sqlite', () => {
  const fakeDb = (failsKeyCheck: boolean) => ({
    execAsync: jest.fn(async () => {}),
    runAsync: jest.fn(async () => {}),
    getAllAsync: jest.fn(async () => []),
    closeAsync: jest.fn(async () => {}),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
    getFirstAsync: jest.fn(async (sql: string) => {
      if (sql.includes('sqlite_master')) {
        if (failsKeyCheck) throw new Error('file is not a database');
        return { n: 0 };
      }
      if (sql.includes('user_version')) return { user_version: 99 };
      return null;
    }),
  });
  return {
    openDatabaseAsync: jest.fn(async () => {
      opened.opens += 1;
      return fakeDb(opened.failFirst && opened.opens === 1);
    }),
    deleteDatabaseAsync: jest.fn(async () => {}),
  };
});

import * as SQLite from 'expo-sqlite';
import { openSqlStore } from '../sql-store';

beforeEach(() => {
  jest.clearAllMocks();
  opened.opens = 0;
});

it('key lost from SecureStore while the old file stayed: starts a new database', async () => {
  secure.key = null;
  opened.failFirst = true;
  const store = await openSqlStore();
  expect(SQLite.deleteDatabaseAsync).toHaveBeenCalledWith('known.db');
  expect(opened.opens).toBe(2);
  expect(store).toMatchObject({ encrypted: true, persistent: true });
});

it('a key that exists but does not open the file: never deletes it (the app falls back to memory)', async () => {
  secure.key = 'ab'.repeat(32);
  opened.failFirst = true;
  await expect(openSqlStore()).rejects.toThrow('file is not a database');
  expect(SQLite.deleteDatabaseAsync).not.toHaveBeenCalled();
});

it('first launch (no key, no file): opens without deleting anything', async () => {
  secure.key = null;
  opened.failFirst = false;
  await openSqlStore();
  expect(SQLite.deleteDatabaseAsync).not.toHaveBeenCalled();
  expect(opened.opens).toBe(1);
});
