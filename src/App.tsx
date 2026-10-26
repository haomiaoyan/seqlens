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
import { baseStats, gcWindows, parseSequence, type MotifMatch } from './lib/sequence'

interface Selection {
  start: number
  end: number
}

export default function App() {
  const [raw, setRaw] = useState('')
  const [activeExample, setActiveExample] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [matches, setMatches] = useState<MotifMatch[]>([])
  const [windowSize, setWindowSize] = useState(60)
  const [step, setStep] = useState(10)
  const workbenchRef = useRef<HTMLElement | null>(null)

  const parsed = useMemo(() => parseSequence(raw), [raw])
  const sequence = parsed.sequence
  const stats = useMemo(() => baseStats(sequence), [sequence])
  const windows = useMemo(() => gcWindows(sequence, windowSize, step), [sequence, windowSize, step])

  // Drop stale selections and motif highlights when the sequence changes.
  useEffect(() => {
    setSelection(null)
    setMatches([])
  }, [sequence])

  // Deep link support: ?example=promoter loads a bundled demo on first paint.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('example')
    if (!requested) return
    const example = EXAMPLES.find((item) => item.id === requested)
    if (!example) return
    setRaw(example.fasta)
    setActiveExample(example.id)
  }, [])

  // Re-apply the URL hash once React has rendered the target sections.
  useEffect(() => {
    const id = window.location.hash.replace('#', '')
    if (!id) return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' })
    })
  }, [])

  const effectiveStep = Math.min(step, Math.max(1, windowSize))

  function loadExample(id: string) {
    const example = EXAMPLES.find((item) => item.id === id)
    if (!example) return
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
    setRaw('')
    setActiveExample(null)
  }

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
            </div>

            <div className="param-controls">
              <label className="param">
                <span className="param__label">
                  窗口 <span className="mono">{windowSize}</span>
                </span>
                <input
                  type="range"
                  min={5}
                  max={Math.max(10, Math.min(500, sequence.length || 500))}
                  step={5}
                  value={Math.min(windowSize, Math.max(10, Math.min(500, sequence.length || 500)))}
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
                  max={Math.max(2, Math.min(200, sequence.length || 200))}
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
                windowSize={windowSize}
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
