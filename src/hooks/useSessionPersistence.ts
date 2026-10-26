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
  const lastWritten = useRef<string | null>(null)

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

    // On mount with a restored session, the payload already matches what is on
    // disk. Record it instead of rewriting, so the "restored" hint survives
    // instead of immediately flipping to "saved".
    if (restored && lastWritten.current === null) {
      lastWritten.current = serialized
      return
    }

    const timer = window.setTimeout(() => {
      if (saveSession(storage, payload)) {
        lastWritten.current = serialized
        setState('saved')
      } else {
        setState('unavailable')
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [raw, windowSize, step, activeExample, enabled, storage, restored])

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
