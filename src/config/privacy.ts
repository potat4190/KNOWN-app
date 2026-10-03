/**
 * Retention limits. One place, so the team can change them after the
 * privacy review (Kezia and Dorcas, pending; see docs/DECISIONS.md).
 */
export const DAY_MS = 24 * 60 * 60 * 1000;

/** A paused session (saved only when she taps "Save this step for later") is deleted after this long. */
export const PAUSE_TTL_MS = 3 * DAY_MS;
