import { APP_NAME } from '../config'

interface Props {
  onStart: () => void
  sequenceLength: number
}

/**
 * 定调区：紧凑的一段话，紧接着就是工作台。
 * 刻意不留"营销 Hero"的结构——没有徽章行、没有特性卡片网格、
 * 没有背景辉光。它的唯一职责是：告诉新来的人这是什么、给一个入口。
 */
export function Intro({ onStart, sequenceLength }: Props) {
  return (
    <section className="intro" id="top" aria-label="简介">
      <div className="intro__inner">
        <p className="intro__kicker mono reveal">{APP_NAME} · 本地运行，序列不出浏览器</p>

        <h1 className="intro__title reveal reveal-delay-1">
          一段序列，
          <br />
          一张<span className="intro__accent">诚实的图</span>。
        </h1>

        <p className="intro__lead reveal reveal-delay-2">
          粘贴一段 DNA 序列，碱基组成、滑窗 GC 曲线、反向互补与 motif
          匹配同时在同一个坐标体系里展开。
          每个数字的计算口径都写在方法说明里，没有服务端，没有上传。
        </p>

        <div className="intro__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            载入示例
            <svg
              viewBox="0 0 16 16"
              width="15"
              height="15"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a className="btn btn--lg" href="#method">
            先看方法说明
          </a>
        </div>

        <p className="intro__meta mono">
          {sequenceLength > 0
            ? `当前已载入 ${sequenceLength.toLocaleString('en-US')} bp`
            : '首版上限 10,000 bp · 教学与轻量探索用途'}
        </p>
      </div>
    </section>
  )
}
