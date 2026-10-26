/**
 * Session persistence for SeqLens.
 *
 * Everything here is deliberately defensive: localStorage can be unavailable
 * (private mode, disabled cookies), full (quota exceeded), or hold data written
 * by an older version. A failed read or write must never break the app, so
 * every function here returns a value instead of throwing.
 *
 * The stored payload is versioned. Bumping `STORAGE_KEY` retires old payloads
 * instead of trying to migrate them.
 */

export const STORAGE_KEY = 'seqlens.session.v1'

/** Same bounds the UI sliders enforce, so a stale payload cannot escape them. */
export const MIN_WINDOW_SIZE = 5
export const MAX_WINDOW_SIZE = 500
export const MIN_STEP = 1
export const MAX_STEP = 200

/** The subset of the DOM Storage API this module needs, so tests can fake it. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface Session {
  raw: string
  windowSize: number
  step: number
  activeExample: string | null
}

/** Returns localStorage when it exists and is writable, otherwise null. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null
    const storage = window.localStorage
    // Some browsers expose localStorage but throw on write (Safari private mode).
    const probe = `${STORAGE_KEY}.probe`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Reads and validates a saved session. Returns null when absent or unusable. */
export function loadSession(storage: StorageLike | null): Session | null {
  if (!storage) return null

  let parsed: unknown
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const record = parsed as Record<string, unknown>

  // `raw` is the only required field: an empty textarea is a valid session too,
  // but we still need the key to exist so a cleared session is distinguishable
  // from "never saved anything".
  if (typeof record.raw !== 'string') return null

  const activeExample =
    typeof record.activeExample === 'string' && record.activeExample.length > 0
      ? record.activeExample
      : null

  // An empty payload carries no information, so treat it as "nothing saved".
  // This keeps a cleared session from being reported as a restored one.
  if (record.raw.length === 0 && activeExample === null) return null

  return {
    raw: record.raw,
    windowSize: clampInteger(record.windowSize, MIN_WINDOW_SIZE, MAX_WINDOW_SIZE, 60),
    step: clampInteger(record.step, MIN_STEP, MAX_STEP, 10),
    activeExample,
  }
}

/**
 * Writes a session. Returns true on success, false when storage is unavailable
 * or the quota is exhausted — callers may surface that, but must not crash.
 */
export function saveSession(storage: StorageLike | null, session: Session): boolean {
  if (!storage) return false
  try {
    const payload: Session = {
      raw: session.raw,
      windowSize: clampInteger(session.windowSize, MIN_WINDOW_SIZE, MAX_WINDOW_SIZE, 60),
      step: clampInteger(session.step, MIN_STEP, MAX_STEP, 10),
      activeExample: session.activeExample,
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    // QuotaExceededError and friends: drop the write rather than break the app.
    return false
  }
}

/** Removes the saved session. Safe to call when nothing was saved. */
export function clearSession(storage: StorageLike | null): void {
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing actionable: the next save overwrites the stale value anyway.
  }
}
