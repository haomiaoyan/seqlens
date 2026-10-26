import { describe, expect, it } from 'vitest'
import {
  COLUMN_ALIGN,
  MAX_ROW_WIDTH,
  MIN_ROW_WIDTH,
  SCROLLBAR_ALLOWANCE,
  columnsFor,
  type Metrics,
} from './row-layout'

/** Desktop metrics taken from the live stylesheet: 14px cell + 1px gap, 52px gutter + 10px gap. */
const DESKTOP = { pitch: 15, leading: 62 }
/** The 760px breakpoint shrinks cells to 12px and the gutter to 40px. */
const NARROW = { pitch: 13, leading: 50 }

function metrics(available: number, base = DESKTOP): Metrics {
  return { ...base, available }
}

describe('columnsFor', () => {
  it('never exceeds the documented maximum', () => {
    expect(columnsFor(metrics(10_000))).toBe(MAX_ROW_WIDTH)
  })

  it('never drops below the documented minimum', () => {
    expect(columnsFor(metrics(80))).toBe(MIN_ROW_WIDTH)
  })

  it('falls back to the maximum before anything has been measured', () => {
    expect(columnsFor({ pitch: 15, leading: 62, available: 0 })).toBe(MAX_ROW_WIDTH)
  })

  it('falls back to the maximum for degenerate pitch instead of dividing by zero', () => {
    expect(columnsFor({ pitch: 0, leading: 62, available: 700 })).toBe(MAX_ROW_WIDTH)
    expect(columnsFor({ pitch: Number.NaN, leading: 62, available: 700 })).toBe(MAX_ROW_WIDTH)
  })

  it('returns a multiple of the alignment step', () => {
    for (const available of [320, 480, 601, 746, 787, 1003]) {
      expect(columnsFor(metrics(available)) % COLUMN_ALIGN).toBe(0)
    }
  })

  it('keeps the full row inside the available width', () => {
    // The invariant the whole change exists for: the widest row must fit.
    for (const available of [320, 420, 562, 671, 746, 787, 961, 1200]) {
      for (const base of [DESKTOP, NARROW]) {
        const columns = columnsFor(metrics(available, base))
        const rowWidth = base.leading + columns * base.pitch
        expect(rowWidth).toBeLessThanOrEqual(available)
      }
    }
  })

  it('reserves room for a vertical scrollbar', () => {
    const available = 800
    const columns = columnsFor(metrics(available))
    const unpadded = DESKTOP.leading + columns * DESKTOP.pitch
    expect(available - unpadded).toBeGreaterThanOrEqual(SCROLLBAR_ALLOWANCE)
  })

  it('matches the widths measured in the browser at 1440px', () => {
    // 746px available produced 40 columns of 15px pitch; 5-alignment leaves 46px.
    expect(columnsFor(metrics(746))).toBe(40)
    expect(columnsFor(metrics(671))).toBe(35)
    expect(columnsFor(metrics(581))).toBe(30)
  })

  it('matches the widths measured in the browser on phones', () => {
    // The viewer reports clientWidth 326/366/496 at a 390/430/560px viewport;
    // `available` is that minus the 6px right padding the stylesheet applies.
    expect(columnsFor(metrics(320, NARROW))).toBe(15)
    expect(columnsFor(metrics(360, NARROW))).toBe(20)
    expect(columnsFor(metrics(490, NARROW))).toBe(30)
    expect(columnsFor(metrics(690, NARROW))).toBe(45)
  })

  it('grows monotonically once the panel has a real width', () => {
    // Not from zero: an unmeasured panel reports `available: 0` and deliberately
    // falls back to the maximum, which is a step down from any real width.
    let previous = 0
    for (let available = 1; available <= 1400; available += 7) {
      const columns = columnsFor(metrics(Math.max(available, MIN_ROW_WIDTH * DESKTOP.pitch)))
      expect(columns).toBeGreaterThanOrEqual(previous)
      previous = columns
    }
  })

  it('does not oscillate by a column between neighbouring widths', () => {
    // A jump of more than one alignment step for a 1px change would mean the row
    // visibly reflows while a window is dragged. Starts above the unmeasured
    // fallback for the same reason as the monotonicity case.
    for (let available = 300; available <= 1100; available += 1) {
      const a = columnsFor(metrics(available))
      const b = columnsFor(metrics(available + 1))
      expect(b - a).toBeLessThanOrEqual(COLUMN_ALIGN)
    }
  })
})
