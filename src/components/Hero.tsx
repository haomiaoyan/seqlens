import { APP_NAME } from '../config'

interface Props {
  onStart: () => void
  sequenceLength: number
}

const FEATURES = [
  {
    title: '碱基组成，一眼看清',
    body: 'A/C/G/T/N 计数与比例条，N 不计入 GC 分母，口径写在方法说明里。',
  },
  {
    title: '滑窗 GC，参数可见',
    body: '窗口大小与步长自己调，曲线每个点都能读出对应的序列区间。',
  },
  {
    title: '图表与序列双向定位',
    body: '拖选曲线或序列，两个视图同时高亮，坐标约定始终一致。',
  },
  {
    title: '反向互补与 motif 匹配',
    body: '只做可解释的精确匹配，命中位置、链方向与坐标全部可导出。',
  },
]

export function Hero({ onStart, sequenceLength }: Props) {
  return (
    <section className="hero" id="top">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__inner">
        <p className="hero__eyebrow">
          <span className="dot" aria-hidden="true" /> 本地优先 · 无需上传 · 开源
        </p>

        <h1 className="hero__title">
          把一段 DNA 序列，
          <br />
          变成一张<span className="hero__accent">可以探索的图</span>。
        </h1>

        <p className="hero__lead">
          {APP_NAME} 把序列位置、参数变化和分析结果放进同一个视图。调整窗口、拖选区域、点击曲线，
          立刻看到它们之间的关系。
        </p>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            载入示例，开始探索
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a className="btn btn--ghost btn--lg" href="#method">
            先看方法说明
          </a>
        </div>

        <p className="hero__meta">
          {sequenceLength > 0 ? (
            <span className="mono">当前已载入 {sequenceLength.toLocaleString('en-US')} bp</span>
          ) : (
            <span className="mono">首版上限 10,000 bp · 教学与轻量探索用途</span>
          )}
        </p>

        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="feature">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
