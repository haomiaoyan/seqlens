/**
 * Keyboard navigation for the two spatial widgets (GC chart and sequence
 * viewer).
 *
 * Both are grids of positions that can be selected with a pointer. Keyboard
 * users need the same reach, so this module models a single "cursor" that moves
 * in fixed units and a selection that either follows the cursor or extends from
 * a fixed anchor while Shift is held.
 *
 * The logic is pure and lives outside React so it can be unit tested; the
 * components only translate key events into these calls.
 */

export interface Selection {
  start: number
  end: number
}

export type CursorKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'PageUp' | 'PageDown'

export interface CursorInput {
  /** Sequence length in bases. */
  length: number
  /** Bases moved by one arrow press. */
  step: number
  /** Bases covered by a selection created at the cursor (a GC window, or 1). */
  span: number
  /** Bases moved by PageUp / PageDown. Defaults to ten steps. */
  pageSize?: number
  key: CursorKey
  shift: boolean
  /** Where the cursor was left by the previous keyboard press. */
  cursor: number
  /** Fixed end of a Shift-extension, or null when not extending. */
  anchor: number | null
  /** Current selection, which may have come from the pointer. */
  selection: Selection | null
}

export interface CursorResult {
  cursor: number
  anchor: number | null
  selection: Selection | null
}

export const KEYBOARD_KEYS: readonly CursorKey[] = [
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]

export function isCursorKey(key: string): key is CursorKey {
  return (KEYBOARD_KEYS as readonly string[]).includes(key)
}

/**
 * Moves the cursor and returns the resulting selection.
 *
 * A pointer selection may be anywhere, so the cursor re-seeds from it whenever
 * it sits outside the current selection. Without that, the first key press after
 * a mouse drag would jump back to the start of the sequence.
 */
export function moveCursor(input: CursorInput): CursorResult {
  const { length, key, shift } = input
  if (length <= 0) return { cursor: 0, anchor: null, selection: null }

  // A selection cannot be wider than the sequence, and never zero-width.
  const span = Math.max(1, Math.min(input.span, length))
  const maxStart = Math.max(0, length - span)

  const selStart = input.selection?.start ?? null
  const selEnd = input.selection?.end ?? null
  const cursorInsideSelection = selStart !== null && input.cursor >= selStart && input.cursor < (selEnd as number)
  const base = cursorInsideSelection ? input.cursor : (selStart ?? 0)

  const page = input.pageSize ?? input.step * 10
  let target = base
  switch (key) {
    case 'ArrowLeft':
      target = base - input.step
      break
    case 'ArrowRight':
      target = base + input.step
      break
    case 'Home':
      target = 0
      break
    case 'End':
      target = maxStart
      break
    case 'PageUp':
      target = base - page
      break
    case 'PageDown':
      target = base + page
      break
  }
  target = Math.max(0, Math.min(maxStart, target))

  if (!shift) {
    return {
      cursor: target,
      anchor: null,
      selection: { start: target, end: Math.min(length, target + span) },
    }
  }

  const anchor = input.anchor ?? base
  return {
    cursor: target,
    anchor,
    selection: {
      start: Math.min(anchor, target),
      end: Math.min(length, Math.max(anchor, target) + span),
    },
  }
}
