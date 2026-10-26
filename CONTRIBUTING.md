# 贡献指南

感谢你对 SeqLens 感兴趣。这是一个教学用的小工具，代码量不大，欢迎提 issue 或 PR。

## 开始之前

- 缺陷、功能建议、文档修正都可以开 issue。请说清楚复现步骤、期望结果、实际结果。
- 想改代码，建议先在 issue 里说一下，避免你写完发现方向不一致。
- 请遵守 [行为准则](CODE_OF_CONDUCT.md)。

## 本地开发

需要 Node.js 18 或更高版本。

```bash
npm install     # 首次
npm run dev     # http://localhost:5173/
```

Windows 用户也可以直接双击 `启动.bat`。

## 提交前自检

```bash
npm run check   # 类型检查 + ESLint + Prettier 检查 + 单元测试
```

`npm run check` 必须全绿。CI 会在每个 PR 上跑同一套命令。

单独跑：

```bash
npm test              # Vitest
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format        # Prettier 改写（提交前跑一次）
```

## 代码约定

- **TypeScript 严格模式**。不要用 `any` 绕开类型；确实需要时写明理由。
- **算法放 `src/lib/`，保持纯函数**，这样可以直接单测。带副作用的（DOM、存储、下载）单独放，并在调用处兜底。
- **新增算法请配单测**。`src/lib/sequence.ts` 的每条约定（0-based 半开区间、N 不进 GC 分母等）都有对应用例，改动时请一并更新。
- **样式集中在 `src/styles.css`**，用已有的设计 token（`--accent`、`--surface` 等），不要散落内联颜色。
- **可访问性不是可选项**：新增交互控件要有键盘路径和可见焦点环；纯图标按钮要有 `aria-label`；动态播报用 `aria-live`。
- **不要引入后端或网络请求**。这个项目的核心承诺是序列不离开浏览器，任何 `fetch` 到外部服务都会破坏这一点。

## 提交信息

用 [Conventional Commits](https://www.conventionalcommits.org/) 前缀：

```
feat: 新增功能
fix: 修复缺陷
docs: 文档
chore: 构建/依赖/杂务
refactor: 重构（不改行为）
test: 测试
```

## 数据与许可

- 示例序列全部是**固定种子合成的假数据**，不包含任何真实研究数据。请勿提交真实样本序列。
- 新增第三方数据或代码时，确认许可证兼容 MIT，并在 README 里注明来源与许可。
- 你的贡献将以 [MIT](LICENSE) 许可证发布。
