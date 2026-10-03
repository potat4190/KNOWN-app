/** Versioned schema migrations for the encrypted DB. Append only; never edit a shipped step. */
export const MIGRATIONS: string[] = [
  // 1: initial schema (brief section 9)
  `CREATE TABLE IF NOT EXISTS moments (
     id TEXT PRIMARY KEY NOT NULL,
     kind TEXT NOT NULL DEFAULT 'moment',
     created_at INTEGER NOT NULL,
     lang TEXT NOT NULL,
     path TEXT NOT NULL,
     sel TEXT,
     "from" TEXT NOT NULL,
     passage INTEGER NOT NULL DEFAULT 0,
     scripture_source TEXT NOT NULL DEFAULT 'bundled',
     version_id INTEGER,
     abbr TEXT NOT NULL DEFAULT '',
     stay TEXT,
     stay_index INTEGER,
     prayer TEXT,
     prayer_edited INTEGER NOT NULL DEFAULT 0,
     words TEXT,
     msg TEXT
   );
   CREATE TABLE IF NOT EXISTS session (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     ts INTEGER NOT NULL,
     state TEXT NOT NULL,
     hist TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS rotation (
     sel TEXT PRIMARY KEY NOT NULL,
     bag TEXT NOT NULL,
     last TEXT,
     count INTEGER NOT NULL DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS meta (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );`,
];

/** Bump when the generated content pack's shape changes. */
export const CONTENT_PACK_VERSION = '1';
