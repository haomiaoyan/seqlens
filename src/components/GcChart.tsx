import { useMemo, useRef, useState } from 'react'
import { useElementWidth } from '../hooks/useElementWidth'
import { isCursorKey, moveCursor } from '../lib/keyboard'
import type { GcWindow } from '../lib/sequence'

interface Props {
  windows: GcWindow[]
  length: number
  selection: { start: number; end: number } | null
  onSelect: (selection: { start: number; end: number } | null) => void
  windowSize: number
  step: number
}

const HEIGHT = 260
const PAD = { top: 18, right: 16, bottom: 30, left: 44 }

export function GcChart({ windows, length, selection, onSelect, windowSize, step }: Props) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hover, setHover] = useState<{ x: number; window: GcWindow } | null>(null)
  const dragAnchor = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)
  // Keyboard cursor and Shift anchor, kept apart from the pointer drag state.
  const keyCursor = useRef(0)
  const keyAnchor = useRef<number | null>(null)

  const plotWidth = Math.max(0, width - PAD.left - PAD.right)
  const plotHeight = HEIGHT - PAD.top - PAD.bottom

  const points = useMemo(() => {
    if (plotWidth <= 0 || windows.length === 0) return []
    return windows.map((w, i) => {
      // Plot every window at its centre so the x axis stays in base-pair units.
      // Index-based spacing would stretch the curve to the full width and make
      // drag selections land on the wrong bases.
      const center = (w.start + w.end) / 2
      const x = length > 0 ? PAD.left + (center / length) * plotWidth : PAD.left + plotWidth / 2
      const y = PAD.top + plotHeight - (w.gc / 100) * plotHeight
      return { x, y, center, gc: w.gc, index: i, window: w }
    })
  }, [windows, plotWidth, plotHeight, length])

  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const baseline = PAD.top + plotHeight
    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ')
    return `${line} L${points[points.length - 1].x.toFixed(2)},${baseline} L${points[0].x.toFixed(2)},${baseline} Z`
  }, [points, plotHeight])

  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ')
  }, [points])

  const xToPosition = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const ratio = (clientX - rect.left - PAD.left) / Math.max(1, plotWidth)
    return Math.round(Math.min(1, Math.max(0, ratio)) * length)
  }

  const selectionRect = useMemo(() => {
    if (!selection || length === 0) return null
    // Computed inline rather than through a helper: a helper defined in the
    // component body is a new function each render, so depending on it would
    // make this memo recompute every time and defeat its purpose.
    const toX = (position: number) => PAD.left + (position / length) * plotWidth
    const x1 = toX(selection.start)
    const x2 = toX(selection.end)
    return { x: Math.min(x1, x2), width: Math.abs(x2 - x1) }
  }, [selection, length, plotWidth])

  const meanGc = windows.length ? windows.reduce((sum, w) => sum + w.gc, 0) / windows.length : 0

  const meanY = PAD.top + plotHeight - (meanGc / 100) * plotHeight

  // The chart is a spatial widget: pointer users drag a region, keyboard users
  // move a cursor that selects one window at a time. Arrow keys step by the
  // window step so every press lands on a plotted point.
  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!isCursorKey(event.key)) return
    event.preventDefault()
    const result = moveCursor({
      length,
      step: Math.max(1, step),
      span: Math.max(1, windowSize),
      key: event.key,
      shift: event.shiftKey,
      cursor: keyCursor.current,
      anchor: keyAnchor.current,
      selection,
    })
    keyCursor.current = result.cursor
    keyAnchor.current = result.anchor
    onSelect(result.selection)
  }

  return (
    <section className="panel panel--chart" aria-labelledby="chart-title">
      <div className="panel__head">
        <h2 id="chart-title">
          <span className="step">04</span> 滑窗 GC 曲线
        </h2>
        <span className="muted mono">
          window {windowSize} · step {step} · 均值 {meanGc.toFixed(1)}%
        </span>
      </div>

      <div className="chart-wrap" ref={ref}>
        <p id="chart-keys" className="visually-hidden">
          曲线可用键盘操作：左右方向键移动选区，PageUp 和 PageDown 快速移动，Home 和 End
          跳到两端，按住 Shift 扩展选区。
        </p>
        {windows.length === 0 ? (
          <p className="empty">序列太短，或尚未输入序列。</p>
        ) : (
          <svg
            ref={svgRef}
            className="chart"
            width={Math.max(width, 320)}
            height={HEIGHT}
            role="application"
            tabIndex={0}
            aria-label={`滑窗 GC 含量曲线，共 ${windows.length} 个窗口，平均 GC ${meanGc.toFixed(1)}%。用左右方向键移动选区，按住 Shift 可扩展选区。`}
            aria-describedby="chart-keys"
            onKeyDown={handleKeyDown}
            onPointerDown={(event) => {
              const position = xToPosition(event.clientX)
              dragAnchor.current = position
              setDragging(true)
              onSelect({ start: position, end: position + 1 })
              ;(event.target as Element).setPointerCapture?.(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (plotWidth <= 0) return
              const rect = svgRef.current?.getBoundingClientRect()
              if (!rect) return
              const x = event.clientX - rect.left
              let nearest = points[0]
              for (const point of points) {
                if (Math.abs(point.x - x) < Math.abs(nearest.x - x)) nearest = point
              }
              setHover({ x: nearest.x, window: nearest.window })

              if (dragging && dragAnchor.current !== null) {
                const position = xToPosition(event.clientX)
                const anchor = dragAnchor.current
                onSelect({
                  start: Math.min(anchor, position),
                  end: Math.max(anchor, position),
                })
              }
            }}
            onPointerUp={() => {
              setDragging(false)
              dragAnchor.current = null
            }}
            onPointerLeave={() => {
              setHover(null)
              if (dragging) {
                setDragging(false)
                dragAnchor.current = null
              }
            }}
          >
            <defs>
              <linearGradient id="gcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 25, 50, 75, 100].map((tick) => {
              const y = PAD.top + plotHeight - (tick / 100) * plotHeight
              return (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + plotWidth}
                    y1={y}
                    y2={y}
                    className={`grid-line${tick === 50 ? ' grid-line--strong' : ''}`}
                  />
                  <text x={PAD.left - 10} y={y + 4} className="axis-text" textAnchor="end">
                    {tick}%
                  </text>
                </g>
              )
            })}

            {selectionRect && (
              <rect
                x={selectionRect.x}
                y={PAD.top}
                width={Math.max(1, selectionRect.width)}
                height={plotHeight}
                className="chart-selection"
              />
            )}

            <path d={areaPath} fill="url(#gcFill)" />
            <path d={linePath} className="chart-line" fill="none" />

            <line
              x1={PAD.left}
              x2={PAD.left + plotWidth}
              y1={meanY}
              y2={meanY}
              className="chart-mean"
            />
            <text x={PAD.left + plotWidth} y={meanY - 6} className="axis-text" textAnchor="end">
              均值 {meanGc.toFixed(1)}%
            </text>

            {hover && (
              <g>
                <line
                  x1={hover.x}
                  x2={hover.x}
                  y1={PAD.top}
                  y2={PAD.top + plotHeight}
                  className="chart-crosshair"
                />
                <circle
                  cx={hover.x}
                  cy={PAD.top + plotHeight - (hover.window.gc / 100) * plotHeight}
                  r={4}
                  className="chart-dot"
                />
              </g>
            )}

            <text x={PAD.left} y={HEIGHT - 8} className="axis-text">
              0
            </text>
            <text x={PAD.left + plotWidth} y={HEIGHT - 8} className="axis-text" textAnchor="end">
              {length.toLocaleString('en-US')} bp
            </text>
          </svg>
        )}

        {hover && (
          <div className="chart-tooltip" style={{ left: `${Math.min(hover.x, width - 130)}px` }}>
            <span className="mono">
              [{hover.window.start}, {hover.window.end})
            </span>
            <strong className="mono">{hover.window.gc.toFixed(1)}% GC</strong>
            <span className="muted mono">{hover.window.acgt} 个 ACGT</span>
          </div>
        )}
      </div>
    </section>
  )
}
