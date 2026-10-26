/**
 * Column maths for the sequence viewer.
 *
 * Kept apart from the component so the fitting rule can be tested without a
 * DOM: the component measures, this module decides.
 */

/** Never show more bases per row than this, however wide the panel gets. */
export const MAX_ROW_WIDTH = 60
/** Below this, the coordinate gutter eats the row and the view stops being useful. */
export const MIN_ROW_WIDTH = 10
/** Slack for sub-pixel rounding so the last cell is never half-clipped. */
export const FIT_SAFETY = 2
/**
 * A vertical scrollbar (once the sequence is taller than the panel) shrinks the
 * content box. Reserving it up front keeps the column count from flipping back
 * and forth as the scrollbar appears and disappears.
 */
export const SCROLLBAR_ALLOWANCE = 10
/**
 * Row starts read best at round offsets, so the column count is rounded down to
 * a multiple of this. Five keeps the wasted gutter under four cells at every
 * width, where ten would leave a visible hole on the right of each row.
 */
export const COLUMN_ALIGN = 5

export interface Metrics {
  /** Distance between two neighbouring cells, gap included. */
  pitch: number
  /** Width of the coordinate gutter plus the gap after it. */
  leading: number
  /** Inner width available to a row, padding already removed. */
  available: number
}

/** Used for the very first paint, before anything can be measured. */
export const INITIAL_METRICS: Metrics = { pitch: 15, leading: 62, available: 0 }

/**
 * How many bases fit on one row. Falls back to the maximum until a measurement
 * arrives, so the first paint is never a cramped one-column layout.
 */
export function columnsFor(metrics: Metrics): number {
  if (!(metrics.pitch > 0) || metrics.available <= 0) return MAX_ROW_WIDTH
  const usable = metrics.available - FIT_SAFETY - SCROLLBAR_ALLOWANCE - metrics.leading
  const fit = Math.floor(usable / metrics.pitch)
  const aligned = Math.floor(fit / COLUMN_ALIGN) * COLUMN_ALIGN
  return Math.min(MAX_ROW_WIDTH, Math.max(MIN_ROW_WIDTH, aligned))
}
