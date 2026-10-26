import { formatInteger, formatPercent, type BaseStats } from '../lib/sequence'

const ORDER = ['A', 'C', 'G', 'T', 'N'] as const

interface Props {
  stats: BaseStats
  selection: { start: number; end: number } | null
}

export function StatsPanel({ stats, selection }: Props) {
  const selectionLength = selection ? Math.max(0, selection.end - selection.start) : 0

  return (
    <section className="panel panel--stats" aria-labelledby="stats-title">
      <div className="panel__head">
        <h2 id="stats-title">
          <span className="step">02</span> 组成概览
        </h2>
        <span className="muted mono">{formatPercent(stats.gc, 1)} GC</span>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat__label">长度</span>
          <span className="stat__figure">
            <span className="stat__value mono">{formatInteger(stats.length)}</span>
            <span className="stat__unit">bp</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">GC 含量</span>
          <span className="stat__figure">
            <span className="stat__value mono">{stats.gc.toFixed(1)}</span>
            <span className="stat__unit">%</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">AT 含量</span>
          <span className="stat__figure">
            <span className="stat__value mono">{stats.at.toFixed(1)}</span>
            <span className="stat__unit">%</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">可计碱基</span>
          <span className="stat__figure">
            <span className="stat__value mono">{formatInteger(stats.acgt)}</span>
            <span className="stat__unit">ACGT</span>
          </span>
        </div>
      </div>

      <div className="composition" role="img" aria-label="碱基组成比例条">
        {ORDER.map((base) => {
          const value = stats.length === 0 ? 0 : (stats.counts[base] / stats.length) * 100
          if (value === 0) return null
          return (
            <span
              key={base}
              className={`composition__seg composition__seg--${base.toLowerCase()}`}
              style={{ width: `${value}%` }}
              title={`${base} ${formatInteger(stats.counts[base])} (${value.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      <ul className="base-legend">
        {ORDER.map((base) => (
          <li key={base}>
            <span className={`swatch swatch--${base.toLowerCase()}`} aria-hidden="true" />
            <span className="base-legend__name">{base}</span>
            <span className="mono base-legend__value">{formatInteger(stats.counts[base])}</span>
            <span className="mono base-legend__pct">
              {stats.length === 0 ? '—' : `${((stats.counts[base] / stats.length) * 100).toFixed(1)}%`}
            </span>
          </li>
        ))}
      </ul>

      <div className="selection-box">
        <span className="selection-box__label">当前选区</span>
        {selection && selectionLength > 0 ? (
          <span className="mono selection-box__value">
            [{formatInteger(selection.start)}, {formatInteger(selection.end)}) · {formatInteger(selectionLength)} bp
          </span>
        ) : (
          <span className="muted">未选择 · 在下方曲线或序列上拖选</span>
        )}
      </div>
    </section>
  )
}
