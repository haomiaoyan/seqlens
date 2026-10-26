import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { isCursorKey, moveCursor } from '../lib/keyboard'
import { chunkSequence, type MotifMatch } from '../lib/sequence'

const ROW_WIDTH = 60

interface Props {
  sequence: string
  selection: { start: number; end: number } | null
  onSelect: (selection: { start: number; end: number } | null) => void
  matches: MotifMatch[]
  showMatches: boolean
}

interface RowProps {
  offset: number
  text: string
  selection: { start: number; end: number } | null
  highlighted: Set<number>
  onSelect: (selection: { start: number; end: number } | null) => void
  onDragStart: (index: number) => void
  onDragMove: (index: number) => void
}

const Row = memo(function Row({
  offset,
  text,
  selection,
  highlighted,
  onDragStart,
  onDragMove,
}: RowProps) {
  const chars: JSX.Element[] = []
  for (let i = 0; i < text.length; i += 1) {
    const index = offset + i
    const base = text[i]
    const inSelection = selection !== null && index >= selection.start && index < selection.end
    const isMatch = highlighted.has(index)
    chars.push(
      <span
        key={index}
        data-index={index}
        className={`base base--${base.toLowerCase()}${inSelection ? ' is-selected' : ''}${
          isMatch ? ' is-match' : ''
        }`}
      >
        {base}
      </span>,
    )
  }

  return (
    <div className="seq-row">
      <span className="seq-row__offset mono">{offset + 1}</span>
      <span
        className="seq-row__bases"
        onPointerDown={(event) => {
          const target = (event.target as HTMLElement).closest('[data-index]') as HTMLElement | null
          if (!target) return
          event.preventDefault()
          onDragStart(Number(target.dataset.index))
        }}
        onPointerMove={(event) => {
          if (!(event.buttons & 1)) return
          const target = (event.target as HTMLElement).closest('[data-index]') as HTMLElement | null
          if (!target) return
          onDragMove(Number(target.dataset.index))
        }}
      >
        {chars}
      </span>
    </div>
  )
})

export function SequenceViewer({ sequence, selection, onSelect, matches, showMatches }: Props) {
  const rows = chunkSequence(sequence, ROW_WIDTH)
  const dragAnchor = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const keyCursor = useRef(0)
  const keyAnchor = useRef<number | null>(null)

  const highlighted = new Set<number>()
  if (showMatches) {
    for (const match of matches) {
      for (let i = match.start; i < match.end; i += 1) highlighted.add(i)
    }
  }

  const onDragStart = useCallback(
    (index: number) => {
      dragAnchor.current = index
      setDragging(true)
      onSelect({ start: index, end: index + 1 })
    },
    [onSelect],
  )

  const onDragMove = useCallback(
    (index: number) => {
      const anchor = dragAnchor.current
      if (anchor === null) return
      const start = Math.min(anchor, index)
      const end = Math.max(anchor, index) + 1
      onSelect({ start, end })
    },
    [onSelect],
  )

  useEffect(() => {
    if (!dragging) return
    const stop = () => {
      setDragging(false)
      dragAnchor.current = null
    }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [dragging])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isCursorKey(event.key)) return
    event.preventDefault()
    const result = moveCursor({
      length: sequence.length,
      step: 1,
      span: 1,
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
    <section className="panel panel--sequence" aria-labelledby="sequence-title">
      <div className="panel__head">
        <h2 id="sequence-title">
          <span className="step">03</span> 序列视图
        </h2>
        <div className="panel__head-actions">
          {selection && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onSelect(null)}>
              取消选区
            </button>
          )}
          <span className="muted mono">0-based · 半开区间</span>
        </div>
      </div>

      <p className="panel__hint">
        在序列上按住拖选，即可与曲线、指标联动；motif
        命中位置以描边标出。键盘用户可先聚焦序列，再用方向键移动。
      </p>

      <div
        className="seq-viewer"
        role="application"
        tabIndex={0}
        aria-label="DNA 序列，可用左右方向键移动选区，按住 Shift 扩展选区"
        aria-describedby="sequence-keys"
        onKeyDown={handleKeyDown}
      >
        <p id="sequence-keys" className="visually-hidden">
          序列可用键盘操作：左右方向键移动选区，PageUp 和 PageDown 快速移动，Home 和 End
          跳到两端，按住 Shift 扩展选区。
        </p>
        {rows.length === 0 ? (
          <p className="empty">还没有序列。粘贴一段序列，或从示例开始。</p>
        ) : (
          rows.map((row) => (
            <Row
              key={row.offset}
              offset={row.offset}
              text={row.text}
              selection={selection}
              highlighted={highlighted}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
            />
          ))
        )}
      </div>
    </section>
  )
}
