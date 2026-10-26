import { APP_NAME } from '../config'

export function MethodSection() {
  return (
    <section className="prose-section" id="method">
      <h2>方法说明</h2>
      <p className="prose-section__lead">
        所有结果都由浏览器内的确定性计算得到，没有服务端参与。下面把首版用到的规则写清楚，方便你核对每一个数字。
      </p>

      <div className="prose-grid">
        <article className="prose-card">
          <h3>输入清洗</h3>
          <ul>
            <li>大小写不敏感，统一转为大写。</li>
            <li>忽略空白、制表符、行号和 FASTA 注释行。</li>
            <li>只接受 A、C、G、T、N；其他字符会被丢弃并提示数量。</li>
            <li>多记录 FASTA 按出现顺序拼接，header 只保留第一条。</li>
          </ul>
        </article>

        <article className="prose-card">
          <h3>碱基组成</h3>
          <ul>
            <li>GC 含量 = (G + C) / (A + C + G + T) × 100%。</li>
            <li>N 不进入分母，避免稀释 GC 比例。</li>
            <li>没有任何 A/C/G/T 时，GC 记为 0%，界面会同时显示可计碱基数。</li>
          </ul>
        </article>

        <article className="prose-card">
          <h3>滑窗 GC</h3>
          <ul>
            <li>窗口从位置 0 开始，按步长向前移动，窗口不越过序列末端。</li>
            <li>窗口大于序列长度时，退化为覆盖整条序列的单个窗口。</li>
            <li>窗口内 GC 仍按 (G + C) / (A + C + G + T) 计算，N 不计入。</li>
            <li>曲线横坐标是窗口中点位置。</li>
          </ul>
        </article>

        <article className="prose-card">
          <h3>坐标与匹配</h3>
          <ul>
            <li>全部使用 0-based、半开区间 [start, end)。</li>
            <li>motif 只做精确子串匹配，不支持 IUPAC 简并码或错配。</li>
            <li>“允许重叠”关闭时，匹配之间不共享碱基。</li>
            <li>搜索反向链时，坐标仍换算回正链，便于在原序列上高亮。</li>
          </ul>
        </article>
      </div>

      <div className="formula">
        <span className="formula__label">GC 含量</span>
        <code className="mono">GC% = (G + C) / (A + C + G + T) × 100</code>
      </div>
    </section>
  )
}

export function LimitsSection() {
  return (
    <section className="prose-section prose-section--limits" id="limits">
      <h2>使用边界</h2>
      <div className="limits-grid">
        <article className="limits-card limits-card--ok">
          <h3>适合</h3>
          <ul>
            <li>理解碱基组成与 GC 含量的基础概念。</li>
            <li>观察窗口参数如何改变曲线形状。</li>
            <li>在课堂上演示序列、坐标与图形的对应关系。</li>
            <li>检查一段短序列的反向互补或精确 motif 位置。</li>
          </ul>
        </article>

        <article className="limits-card limits-card--no">
          <h3>不适合</h3>
          <ul>
            <li>临床诊断、疾病风险判断或任何医疗决策。</li>
            <li>替代 BLAST、比对、变异检测或富集分析工具。</li>
            <li>处理需要保密的人类基因组数据。</li>
            <li>作为论文或生产流程中的权威计算依据。</li>
          </ul>
        </article>
      </div>

      <p className="limits-note">
        {APP_NAME}{' '}
        是教学与轻量探索工具，不提供科研级结论。若结果将用于研究或临床场景，请使用经过验证的专业流程并独立复核。
      </p>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <strong>{APP_NAME}</strong>
          <p className="muted">本地优先的 DNA 序列可视化学习工具。</p>
        </div>
        <p className="muted mono site-footer__meta">
          合成示例数据 · 计算结果仅用于学习 · MIT License
        </p>
      </div>
    </footer>
  )
}
