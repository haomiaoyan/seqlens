import { describe, expect, it } from 'vitest'
import { isCursorKey, moveCursor, type CursorInput } from './keyboard'

const base: CursorInput = {
  length: 100,
  step: 1,
  span: 1,
  key: 'ArrowRight',
  shift: false,
  cursor: 0,
  anchor: null,
  selection: null,
}

const run = (overrides: Partial<CursorInput>) => moveCursor({ ...base, ...overrides })

describe('moveCursor', () => {
  it('moves right by one step from a null selection', () => {
    const result = run({})
    expect(result.selection).toEqual({ start: 1, end: 2 })
    expect(result.cursor).toBe(1)
  })

  it('moves left and clamps at zero', () => {
    expect(run({ key: 'ArrowLeft', selection: { start: 0, end: 1 } }).selection).toEqual({ start: 0, end: 1 })
    expect(run({ key: 'ArrowLeft', selection: { start: 3, end: 4 }, cursor: 3 }).selection).toEqual({
      start: 2,
      end: 3,
    })
  })

  it('clamps the right edge to the sequence length', () => {
    const result = run({ selection: { start: 99, end: 100 }, cursor: 99 })
    expect(result.selection).toEqual({ start: 99, end: 100 })
    expect(result.cursor).toBe(99)
  })

  it('jumps to the start with Home and to the last window with End', () => {
    expect(run({ key: 'Home', selection: { start: 40, end: 41 }, cursor: 40 }).selection).toEqual({
      start: 0,
      end: 1,
    })
    expect(run({ key: 'End', selection: { start: 0, end: 1 } }).selection).toEqual({ start: 99, end: 100 })
  })

  it('pages by ten steps by default', () => {
    expect(run({ key: 'PageDown', selection: { start: 0, end: 1 } }).selection).toEqual({ start: 10, end: 11 })
    expect(run({ key: 'PageUp', selection: { start: 50, end: 51 }, cursor: 50 }).selection).toEqual({
      start: 40,
      end: 41,
    })
  })

  it('honours an explicit pageSize', () => {
    expect(run({ key: 'PageDown', pageSize: 25, selection: { start: 0, end: 1 } }).selection).toEqual({
      start: 25,
      end: 26,
    })
  })

  it('extends the selection while shift is held', () => {
    const first = run({ shift: true, selection: { start: 5, end: 6 }, cursor: 5, anchor: null })
    expect(first.selection).toEqual({ start: 5, end: 7 })
    expect(first.anchor).toBe(5)

    const second = run({ shift: true, selection: first.selection, cursor: first.cursor, anchor: first.anchor })
    expect(second.selection).toEqual({ start: 5, end: 8 })
    expect(second.anchor).toBe(5)
  })

  it('extends backwards when shifting left past the anchor', () => {
    const result = run({ key: 'ArrowLeft', shift: true, selection: { start: 5, end: 7 }, cursor: 6, anchor: 6 })
    expect(result.selection).toEqual({ start: 5, end: 7 })
  })

  it('collapses the anchor when shift is released', () => {
    // Without shift the selection is a fresh cursor span, so an extended range
    // collapses to the widget's canonical width.
    const result = run({ shift: false, selection: { start: 5, end: 9 }, cursor: 8, anchor: 5 })
    expect(result.anchor).toBeNull()
    expect(result.selection).toEqual({ start: 9, end: 10 })
  })

  it('seeds from the selection after a pointer drag', () => {
    // Cursor is stale (0) but the pointer selected 40..50; the next press should
    // continue from the selection, not jump back to the start. The resulting
    // selection takes the widget's canonical span rather than the dragged width.
    const result = run({ selection: { start: 40, end: 50 }, cursor: 0 })
    expect(result.selection).toEqual({ start: 41, end: 42 })
  })

  it('uses the cursor when it is already inside the selection', () => {
    const result = run({ selection: { start: 40, end: 50 }, cursor: 45 })
    expect(result.selection).toEqual({ start: 46, end: 47 })
  })

  it('keeps the window span when moving', () => {
    const result = run({ span: 20, selection: { start: 0, end: 20 }, cursor: 0 })
    expect(result.selection).toEqual({ start: 1, end: 21 })
  })

  it('never lets the window run past the end', () => {
    const result = run({ span: 20, key: 'End', length: 54 })
    expect(result.selection).toEqual({ start: 34, end: 54 })
  })

  it('clamps a span larger than the sequence', () => {
    const result = run({ span: 500, length: 54, selection: { start: 0, end: 54 }, cursor: 0 })
    expect(result.selection).toEqual({ start: 0, end: 54 })
  })

  it('returns an empty result for an empty sequence', () => {
    expect(run({ length: 0, selection: null })).toEqual({ cursor: 0, anchor: null, selection: null })
  })

  it('treats an unknown key as no movement', () => {
    const result = moveCursor({ ...base, key: 'ArrowRight', selection: { start: 7, end: 8 }, cursor: 7 })
    expect(result.selection).toEqual({ start: 8, end: 9 })
  })
})

describe('isCursorKey', () => {
  it('accepts navigation keys', () => {
    expect(isCursorKey('ArrowLeft')).toBe(true)
    expect(isCursorKey('PageDown')).toBe(true)
  })

  it('rejects other keys', () => {
    expect(isCursorKey('Enter')).toBe(false)
    expect(isCursorKey('a')).toBe(false)
  })
})
