import { useEffect, useState } from 'react'
import { copyText, downloadText, timestamp } from '../lib/download'
import { findMotif, formatInteger, reverseComplement, validateMotif } from '../lib/sequence'
import type { MotifMatch, Strand } from '../lib/sequence'

interface Props {
  sequence: string
  onMatchesChange: (matches: MotifMatch[]) => void
  selection: { start: number; end: number } | null
  onFocus: (start: number, end: number) => void
}

type Tab = 'transform' | 'motif'

export function ToolsPanel({ sequence, onMatchesChange, onFocus }: Props) {
  const [tab, setTab] = useState<Tab>('transform')
  const [motif, setMotif] = useState('CACGTG')
  const [overlapping, setOverlapping] = useState(false)
  const [bothStrands, setBothStrands] = useState(false)
  const [result, setResult] = useState<MotifMatch[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const motifError = validateMotif(motif)
  const revComp = reverseComplement(sequence)

  // A new sequence invalidates every previous hit; keep the panel in sync with
  // the viewer instead of showing coordinates that no longer exist.
  useEffect(() => {
    setResult(null)
  }, [sequence])

  function runSearch() {
    if (motifError) return
    const matches = findMotif(sequence, motif, { overlapping, bothStrands })
    setResult(matches)
    onMatchesChange(matches)
  }

  function clearSearch() {
    setResult(null)
    onMatchesChange([])
  }

  async function handleCopy(label: string, text: string) {
    const ok = await copyText(text)
    setCopied(ok ? label : null)
    window.setTimeout(() => setCopied(null), 1600)
  }

  function exportMatches() {
    if (!result) return
    const lines = [
      `# SeqLens motif export`,
      `# motif: ${motif.trim().toUpperCase()}`,
      `# overlapping: ${overlapping}`,
      `# bothStrands: ${bothStrands}`,
      `# coordinates: 0-based, half-open [start, end)`,
      'start\tend\tlength\tstrand',
      ...result.map((m) => `${m.start}\t${m.end}\t${m.end - m.start}\t${m.strand}`),
    ]
    downloadText(`seqlens-motif-${timestamp()}.tsv`, lines.join('\n'))
  }

  const plus = result?.filter((m) => m.strand === '+').length ?? 0
  const minus = result?.filter((m) => m.strand === '-').length ?? 0

  return (
    <section className="panel panel--tools" aria-labelledby="tools-title">
      <div className="panel__head">
        <h2 id="tools-title">
          <span className="step">05</span> 序列工具
        </h2>
      </div>

      <div className="tabs" role="tablist" aria-label="序列工具">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'transform'}
          className={`tab${tab === 'transform' ? ' is-active' : ''}`}
          onClick={() => setTab('transform')}
        >
          反向互补
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'motif'}
          className={`tab${tab === 'motif' ? ' is-active' : ''}`}
          onClick={() => setTab('motif')}
        >
          Motif 匹配
        </button>
      </div>

      {tab === 'transform' && (
        <div className="tab-panel">
          <p className="panel__hint">
            A↔T、C↔G，N 保持不变，顺序反转。结果坐标仍对应原序列。
          </p>
          <div className="code-block">
            <div className="code-block__head">
              <span className="mono">reverse complement</span>
              <div className="code-block__actions">
                <button type="button" className="btn btn--ghost btn--xs" onClick={() => handleCopy('rc', revComp)}>
                  {copied === 'rc' ? '已复制' : '复制'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--xs"
                  onClick={() => downloadText(`seqlens-revcomp-${timestamp()}.fasta`, `>reverse_complement\n${revComp}\n`)}
                >
                  导出 FASTA
                </button>
              </div>
            </div>
            <pre className="code-block__body mono">{revComp || '—'}</pre>
          </div>
        </div>
      )}

      {tab === 'motif' && (
        <div className="tab-panel">
          <p className="panel__hint">只做精确子串匹配，不支持 IUPAC 简并码或错配。</p>

          <label className="field">
            <span className="field__label">Motif（仅 A/C/G/T）</span>
            <input
              className="input mono"
              value={motif}
              spellCheck={false}
              onChange={(event) => setMotif(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') runSearch()
              }}
            />
          </label>
          {motifError && motif.trim().length > 0 && <p className="notice notice--warn">{motifError}</p>}

          <div className="check-row">
            <label className="check">
              <input type="checkbox" checked={overlapping} onChange={(event) => setOverlapping(event.target.checked)} />
              <span>允许重叠</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={bothStrands} onChange={(event) => setBothStrands(event.target.checked)} />
              <span>同时搜索反向链</span>
            </label>
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={runSearch} disabled={!!motifError}>
              搜索
            </button>
            <button type="button" className="btn btn--ghost" onClick={clearSearch} disabled={!result}>
              清除高亮
            </button>
            <button type="button" className="btn btn--ghost" onClick={exportMatches} disabled={!result}>
              导出 TSV
            </button>
          </div>

          {result && (
            <div className="result-summary">
              <p>
                命中 <strong className="mono">{formatInteger(result.length)}</strong> 处
                {bothStrands && (
                  <span className="muted mono">
                    {' '}
                    · +链 {plus} · −链 {minus}
                  </span>
                )}
              </p>
              {result.length === 0 ? (
                <p className="muted">没有找到精确匹配。可以试试示例序列里的 CACGTG。</p>
              ) : (
                <ul className="hit-list">
                  {result.slice(0, 200).map((match, index) => (
                    <li key={`${match.start}-${match.strand}-${index}`}>
                      <button type="button" className="hit" onClick={() => onFocus(match.start, match.end)}>
                        <span className="mono">
                          {match.start}–{match.end}
                        </span>
                        <span className={`strand strand--${match.strand === '+' ? 'plus' : 'minus'}` as const}>
                          {match.strand as Strand}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {result.length > 200 && <p className="muted">仅显示前 200 处，完整结果请导出 TSV。</p>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
