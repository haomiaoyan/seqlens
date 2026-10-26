import { describe, expect, it } from 'vitest'
import {
  MAX_STEP,
  MAX_WINDOW_SIZE,
  MIN_STEP,
  MIN_WINDOW_SIZE,
  STORAGE_KEY,
  clearSession,
  loadSession,
  saveSession,
  type StorageLike,
} from './storage'

/** In-memory stand-in for localStorage, with hooks for failure modes. */
function makeStorage(options: { failWrite?: boolean; failRead?: boolean } = {}) {
  const data = new Map<string, string>()
  const storage: StorageLike = {
    getItem(key) {
      if (options.failRead) throw new Error('read blocked')
      return data.has(key) ? (data.get(key) as string) : null
    },
    setItem(key, value) {
      if (options.failWrite) throw new Error('QuotaExceededError')
      data.set(key, value)
    },
    removeItem(key) {
      data.delete(key)
    },
  }
  return { storage, data }
}

const sample = { raw: '>seq\nACGT', windowSize: 60, step: 10, activeExample: null }

describe('loadSession', () => {
  it('returns null when storage is unavailable', () => {
    expect(loadSession(null)).toBeNull()
  })

  it('returns null when nothing was saved', () => {
    const { storage } = makeStorage()
    expect(loadSession(storage)).toBeNull()
  })

  it('returns null when the payload is not valid JSON', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, '{not json')
    expect(loadSession(storage)).toBeNull()
  })

  it('returns null when the payload is not an object', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, '"just a string"')
    expect(loadSession(storage)).toBeNull()
  })

  it('returns null when raw is missing, since that is the only required field', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ windowSize: 60, step: 10 }))
    expect(loadSession(storage)).toBeNull()
  })

  it('treats an empty payload as "nothing saved" rather than a restored session', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: '' }))
    expect(loadSession(storage)).toBeNull()
  })

  it('keeps an empty raw string when an example is still selected', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: '', activeExample: 'promoter' }))
    expect(loadSession(storage)).toMatchObject({ raw: '', activeExample: 'promoter' })
  })

  it('survives a storage read that throws', () => {
    const { storage } = makeStorage({ failRead: true })
    expect(loadSession(storage)).toBeNull()
  })

  it('falls back to defaults when the numbers are unusable', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: 'ACGT', windowSize: 'wide', step: null }))
    expect(loadSession(storage)).toEqual({
      raw: 'ACGT',
      windowSize: 60,
      step: 10,
      activeExample: null,
    })
  })

  it('clamps stored numbers into the slider range', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: 'ACGT', windowSize: 99999, step: -5 }))
    expect(loadSession(storage)).toMatchObject({ windowSize: MAX_WINDOW_SIZE, step: MIN_STEP })
  })

  it('rounds fractional numbers instead of passing them through', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: 'ACGT', windowSize: 60.6, step: 10.4 }))
    expect(loadSession(storage)).toMatchObject({ windowSize: 61, step: 10 })
  })

  it('drops an unusable activeExample but keeps the rest', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: 'ACGT', activeExample: 42 }))
    expect(loadSession(storage)?.activeExample).toBeNull()
  })

  it('drops an empty-string activeExample', () => {
    const { storage, data } = makeStorage()
    data.set(STORAGE_KEY, JSON.stringify({ raw: 'ACGT', activeExample: '' }))
    expect(loadSession(storage)?.activeExample).toBeNull()
  })
})

describe('saveSession', () => {
  it('returns false when storage is unavailable', () => {
    expect(saveSession(null, sample)).toBe(false)
  })

  it('writes a payload that loads back unchanged', () => {
    const { storage } = makeStorage()
    expect(saveSession(storage, sample)).toBe(true)
    expect(loadSession(storage)).toEqual(sample)
  })

  it('returns false instead of throwing when the quota is exceeded', () => {
    const { storage } = makeStorage({ failWrite: true })
    expect(saveSession(storage, sample)).toBe(false)
  })

  it('clamps out-of-range numbers before writing', () => {
    const { storage } = makeStorage()
    saveSession(storage, { ...sample, windowSize: 1, step: 9999 })
    expect(loadSession(storage)).toMatchObject({
      windowSize: MIN_WINDOW_SIZE,
      step: MAX_STEP,
    })
  })
})

describe('clearSession', () => {
  it('removes a saved payload', () => {
    const { storage } = makeStorage()
    saveSession(storage, sample)
    clearSession(storage)
    expect(loadSession(storage)).toBeNull()
  })

  it('is a no-op when nothing was saved', () => {
    const { storage } = makeStorage()
    expect(() => clearSession(storage)).not.toThrow()
    expect(loadSession(storage)).toBeNull()
  })

  it('is a no-op when storage is unavailable', () => {
    expect(() => clearSession(null)).not.toThrow()
  })

  it('does not throw when removeItem throws', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(() => clearSession(storage)).not.toThrow()
  })
})
