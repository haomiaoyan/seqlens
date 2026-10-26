import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { SequenceInput } from './components/SequenceInput'
import { StatsPanel } from './components/StatsPanel'
import { SequenceViewer } from './components/SequenceViewer'
import { GcChart } from './components/GcChart'
import { ToolsPanel } from './components/ToolsPanel'
import { Footer, LimitsSection, MethodSection } from './components/Sections'
import { EXAMPLES } from './data/examples'
import { readSavedSession, useSessionPersistence } from './hooks/useSessionPersistence'
import { baseStats, gcWindows, parseSequence, type MotifMatch } from './lib/sequence'
import { MAX_STEP, MAX_WINDOW_SIZE } from './lib/storage'

interface Selection {
  start: number
  end: number
}

export default function App() {
  // Read the saved session once, before the first paint, so restored values do
  // not flash as defaults first. `useState` with a lazy initializer runs once.
  const [restored] = useState(() => readSavedSession())

  // A shared deep link (?example=...) is an explicit request, so it wins over a
  // restored session on screen. It must not, however, be written to storage
  // before the visitor touches anything: otherwise merely opening someone
  // else's link would silently destroy the session they had been working on.
  const [deepLinkId] = useState<string | null>(() => {
    const requested = new URLSearchParams(window.location.search).get('example')
    if (!requested) return null
    return EXAMPLES.some((item) => item.id === requested) ? requested : null
  })
  const [deepLinkPristine, setDeepLinkPristine] = useState(deepLinkId !== null && restored !== null)

  const [raw, setRaw] = useState(restored?.raw ?? '')
  const [activeExample, setActiveExample] = useState<string | null>(restored?.activeExample ?? null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [matches, setMatches] = useState<MotifMatch[]>([])
  const [windowSize, setWindowSize] = useState(restored?.windowSize ?? 60)
  const [step, setStep] = useState(restored?.step ?? 10)
  const workbenchRef = useRef<HTMLElement | null>(null)

  const parsed = useMemo(() => parseSequence(raw), [raw])
  const sequence = parsed.sequence
  const stats = useMemo(() => baseStats(sequence), [sequence])
  const windows = useMemo(() => gcWindows(sequence, windowSize, step), [sequence, windowSize, step])

  const persistence = useSessionPersistence({
    raw,
    windowSize,
    step,
    activeExample,
    // Hold off while showing a deep-linked example the visitor has not touched,
    // so a shared link cannot overwrite their own saved session.
    enabled: !deepLinkPristine,
    restored: restored !== null,
  })
  const { markRestored, forget } = persistence

  // Drop stale selections and motif highlights when the sequence changes.
  useEffect(() => {
    setSelection(null)
    setMatches([])
  }, [sequence])

  // Surface the "restored from last visit" hint only when something was actually
  // recovered, so a first-time visitor sees the normal copy.
  useEffect(() => {
    if (restored) markRestored()
  }, [restored, markRestored])

  // Deep link support: ?example=promoter loads a bundled demo on first paint.
  // It wins over a restored session on screen, since the link is an explicit
  // request — but see `deepLinkPristine`: it is not persisted until the visitor
  // interacts, so opening a shared link cannot wipe their own work.
  useEffect(() => {
    if (!deepLinkId) return
    const example = EXAMPLES.find((item) => item.id === deepLinkId)
    if (!example) return
    setRaw(example.fasta)
    setActiveExample(example.id)
  }, [deepLinkId])

  // Re-apply the URL hash once React has rendered the target sections.
  useEffect(() => {
    const id = window.location.hash.replace('#', '')
    if (!id) return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' })
    })
  }, [])

  // A stored window can be larger than the current sequence (localStorage is
  // restored before any sequence exists, and sequences can be cleared or
  // shortened). Derive one clamped value and use it for the label, the slider
  // and the computation alike, so the three can never disagree.
  // The window slider moves in steps of 5 from min 5, so the upper bound is
  // snapped down to that grid; otherwise the browser would render a different
  // number than the label.
  const rawWindowMax = Math.max(10, Math.min(MAX_WINDOW_SIZE, sequence.length || MAX_WINDOW_SIZE))
  const windowMax = Math.max(5, Math.floor(rawWindowMax / 5) * 5)
  const stepMax = Math.max(2, Math.min(MAX_STEP, sequence.length || MAX_STEP))
  const effectiveWindow = Math.min(windowSize, windowMax)
  const effectiveStep = Math.min(step, stepMax, Math.max(1, effectiveWindow))

  function loadExample(id: string) {
    const example = EXAMPLES.find((item) => item.id === id)
    if (!example) return
    setDeepLinkPristine(false)
    setRaw(example.fasta)
    setActiveExample(id)
    requestAnimationFrame(() => {
      workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function startWithExample() {
    loadExample(EXAMPLES[0].id)
  }

  function clearAll() {
    setDeepLinkPristine(false)
    setRaw('')
    setActiveExample(null)
    forget()
  }

  const restoredLabel =
    persistence.state === 'restored' ? '已恢复上次会话' : persistence.state === 'saved' ? '已自动保存' : null

  return (
    <div className="app">
      <Header />
      <main>
        <Hero onStart={startWithExample} sequenceLength={sequence.length} />

        <section className="workbench" id="workbench" ref={workbenchRef} aria-labelledby="workbench-title">
          <div className="workbench__head">
            <div>
              <h2 id="workbench-title">工作台</h2>
              <p className="muted">
                {activeExample
                  ? `当前示例：${EXAMPLES.find((item) => item.id === activeExample)?.name ?? ''}`
                  : '粘贴序列或载入示例，所有计算在本地完成。'}
              </p>
              <p className="session-note" aria-live="polite">
                {persistence.state === 'unavailable' ? (
                  <span className="session-note__item session-note__item--dim">
                    浏览器禁用了本地存储，本次内容不会自动保存
                  </span>
                ) : deepLinkPristine ? (
                  <span className="session-note__item session-note__item--dim">
                    正在预览示例，你上次的序列仍保留着
                  </span>
                ) : (
                  restoredLabel && (
                    <span className="session-note__item">
                      <span className="dot" aria-hidden="true" />
                      {restoredLabel}
                      <span className="session-note__hint">仅存在这台设备上</span>
                    </span>
                  )
                )}
              </p>
            </div>

            <div className="param-controls">
              <label className="param">
                <span className="param__label">
                  窗口 <span className="mono">{effectiveWindow}</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={windowMax}
                  step={5}
                  value={effectiveWindow}
                  onChange={(event) => setWindowSize(Number(event.target.value))}
                />
              </label>
              <label className="param">
                <span className="param__label">
                  步长 <span className="mono">{effectiveStep}</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={stepMax}
                  step={1}
                  value={effectiveStep}
                  onChange={(event) => setStep(Number(event.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="workbench__grid">
            <div className="workbench__col workbench__col--left">
              <SequenceInput
                raw={raw}
                onRawChange={(value) => {
                  setDeepLinkPristine(false)
                  setRaw(value)
                  setActiveExample(null)
                }}
                parsed={parsed}
                onLoadExample={loadExample}
                onClear={clearAll}
              />
              <StatsPanel stats={stats} selection={selection} />
            </div>

            <div className="workbench__col workbench__col--right">
              <GcChart
                windows={windows}
                length={sequence.length}
                selection={selection}
                onSelect={setSelection}
                windowSize={effectiveWindow}
                step={effectiveStep}
              />
              <SequenceViewer
                sequence={sequence}
                selection={selection}
                onSelect={setSelection}
                matches={matches}
                showMatches={matches.length > 0}
              />
              <ToolsPanel
                sequence={sequence}
                onMatchesChange={setMatches}
                selection={selection}
                onFocus={(start, end) => {
                  setSelection({ start, end })
                  document.getElementById('sequence-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              />
            </div>
          </div>
        </section>

        <MethodSection />
        <LimitsSection />
      </main>
      <Footer />
    </div>
  )
}
