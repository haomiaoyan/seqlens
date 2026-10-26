# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [未发布]

## [0.1.0] - 2026-10-26

首个公开版本。

### 新增

- 序列输入：支持 FASTA 与纯序列粘贴、本地文件读取（上限 8 MB）。
- 输入清洗：大小写不敏感，忽略空白、行号与 `;` 注释行，只保留 A/C/G/T/N，丢弃的字符计数提示。
- 碱基组成：A/C/G/T/N 计数与占比条，GC 含量按 `(G+C)/(A+C+G+T)` 计算。
- 滑窗 GC 曲线：窗口 5–500 bp、步长 1–200 bp 可调，悬停读数，拖选区域，横坐标取窗口中点。
- 序列视图：60 列/行排版，指针拖选，与曲线共用同一套坐标。
- 双向联动：拖选曲线高亮对应序列；点击 motif 命中跳到对应碱基。
- 反向互补：A↔T、C↔G、N 保持不变、顺序反转，可复制或导出 FASTA。
- Motif 匹配：精确子串匹配，支持重叠开关与正/反链同时搜索，结果可导出 TSV。
- 会话保留：序列与窗口参数自动写入 `localStorage`（500 ms 防抖），刷新后恢复；无痕模式下降级提示。
- 键盘操作：曲线与序列视图可用方向键、`Shift` 扩展、`PageUp`/`PageDown`、`Home`/`End` 操作；焦点环统一用 `:focus-visible`。
- 无障碍：`aria-live` 播报选区变化，图表与序列视图使用 `role="application"` 并提供按键说明。
- 错误兜底：每个面板包一层 `ErrorBoundary`，单个面板渲染失败不会白屏。
- 深链：`?example=<id>` 直接载入内置示例并跳到工作台；不会覆盖访客已保存的会话。
- 社交预览：`public/og.png` 与完整的 Open Graph / Twitter Card 元标签。
- 部署：GitHub Actions 自动构建并发布到 GitHub Pages，首次运行自动启用 Pages。

### 工程

- 61 个 Vitest 单元测试，覆盖序列算法、会话存储容错与键盘选区计算。
- ESLint（`typescript-eslint` + `eslint-plugin-react-hooks`）与 Prettier 统一代码风格，`npm run check` 串联全部检查。
- 图表为手写 SVG，无图表库依赖；运行时依赖只有 React 与 ReactDOM。

[未发布]: https://github.com/haomiaoyan/seqlens/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/haomiaoyan/seqlens/releases/tag/v0.1.0
