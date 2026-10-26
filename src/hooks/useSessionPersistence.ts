import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearSession,
  getBrowserStorage,
  loadSession,
  saveSession,
  type Session,
  type StorageLike,
} from '../lib/storage'

export type PersistenceState = 'idle' | 'saved' | 'restored' | 'unavailable'

interface Options {
  raw: string
  windowSize: number
  step: number
  activeExample: string | null
  /** Skip writing until the user actually changes something. */
  enabled: boolean
  /** True when the initial state came from storage, so mount does not rewrite it. */
  restored: boolean
}

const DEBOUNCE_MS = 500

/**
 * Keeps the current session in localStorage.
 *
 * Writes are debounced because the textarea fires on every keystroke and a
 * 10 kb sequence would otherwise be serialized on each one. Reads happen once,
 * by the caller, so the first paint already has the restored values.
 */
export function useSessionPersistence({ raw, windowSize, step, activeExample, enabled, restored }: Options) {
  const [storage] = useState<StorageLike | null>(() => getBrowserStorage())
  const [state, setState] = useState<PersistenceState>(() => (storage ? 'idle' : 'unavailable'))
  // Seed the "already on disk" marker with the restored payload on the very
  // first render, so mounting does not rewrite what was just read (that would
  // flip the "restored" hint to "saved" immediately). Doing it here rather than
  // in the effect matters: a deep link starts disabled, and the effect's first
  // enabled run carries the example, not the restored session — comparing
  // against that would swallow the visitor's first real edit.
  const lastWritten = useRef<string | null>(
    restored ? JSON.stringify({ raw, windowSize, step, activeExample } satisfies Session) : null,
  )

  useEffect(() => {
    if (!enabled || !storage) return

    const payload: Session = { raw, windowSize, step, activeExample }
    const serialized = JSON.stringify(payload)
    // Nothing changed since the last successful write: skip the timer entirely.
    if (serialized === lastWritten.current) return

    // An untouched, empty workbench is not worth storing. Writing it would leave
    // a key behind on every first visit and make the next visit look "restored".
    const isBlank = raw.length === 0 && activeExample === null
    if (isBlank && lastWritten.current === null) return

    const timer = window.setTimeout(() => {
      if (saveSession(storage, payload)) {
        lastWritten.current = serialized
        setState('saved')
      } else {
        setState('unavailable')
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [raw, windowSize, step, activeExample, enabled, storage])

  const forget = useCallback(() => {
    clearSession(storage)
    lastWritten.current = null
    setState(storage ? 'idle' : 'unavailable')
  }, [storage])

  const markRestored = useCallback(() => {
    setState((current) => (current === 'unavailable' ? current : 'restored'))
  }, [])

  return { state, forget, markRestored, storage }
}

/** Reads the saved session once, for lazy initial state. */
export function readSavedSession(): Session | null {
  return loadSession(getBrowserStorage())
}
