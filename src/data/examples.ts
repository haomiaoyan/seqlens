/** Deterministic synthetic examples. No real patient or research data is bundled. */

function makeRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function pick(rng: () => number, alphabet: string): string {
  return alphabet[Math.floor(rng() * alphabet.length) % alphabet.length]
}

function generate(rng: () => number, length: number, gc: number): string {
  const alphabet = gc >= 0.5 ? 'GCGCGCGCAT' : 'ATATATATGC'
  let out = ''
  for (let i = 0; i < length; i += 1) out += pick(rng, alphabet)
  return out
}

/** Replaces `length` bases starting at `at` with `insert`. */
function splice(sequence: string, at: number, insert: string): string {
  return sequence.slice(0, at) + insert + sequence.slice(at + insert.length)
}

function toFasta(header: string, sequence: string, width = 70): string {
  const lines: string[] = []
  for (let i = 0; i < sequence.length; i += width) lines.push(sequence.slice(i, i + width))
  return `>${header}\n${lines.join('\n')}\n`
}

function buildPromoterLike(): string {
  const rng = makeRng(20261025)
  let seq =
    generate(rng, 60, 0.32) +
    generate(rng, 150, 0.68) +
    generate(rng, 80, 0.4) +
    generate(rng, 110, 0.62) +
    generate(rng, 60, 0.35)
  seq = splice(seq, 92, 'CACGTG')
  seq = splice(seq, 240, 'CACGTG')
  seq = splice(seq, 330, 'GGGCGG')
  return seq
}

function buildGcIsland(): string {
  const rng = makeRng(731)
  return generate(rng, 120, 0.3) + generate(rng, 300, 0.82) + generate(rng, 120, 0.28)
}

function buildRepeat(): string {
  const rng = makeRng(4242)
  const repeat = generate(rng, 24, 0.35)
  const block = (repeat + generate(rng, 12, 0.5)).repeat(9)
  return generate(rng, 90, 0.45) + block + generate(rng, 90, 0.55)
}

function buildMessy(): string {
  const rng = makeRng(99)
  const clean = generate(rng, 180, 0.52)
  const withNs = clean.slice(0, 60) + 'NNNNNNNN' + clean.slice(60, 120) + 'NNNN' + clean.slice(120)
  const lower = withNs.toLowerCase()
  const numbered = lower.match(/.{1,60}/g)!.map((line, i) => `${(i + 1) * 60}\t${line}`).join('\n')
  return `>messy-example | 故意混入大小写、行号、空格与非法字符 U\n${numbered}\n\n  ${withNs.slice(0, 40)} UUU  ${withNs.slice(40, 80)}\n`
}

export interface Example {
  id: string
  name: string
  note: string
  fasta: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'promoter',
    name: '启动子样片段',
    note: '合成序列 · 460 bp · 含 CACGTG motif',
    fasta: toFasta('synthetic promoter-like fragment | 合成示例，非真实研究数据', buildPromoterLike()),
  },
  {
    id: 'gcisland',
    name: '高 GC 岛',
    note: '合成序列 · 540 bp · GC 富集区',
    fasta: toFasta('synthetic GC-rich island | 合成示例，非真实研究数据', buildGcIsland()),
  },
  {
    id: 'repeat',
    name: '低复杂度重复',
    note: '合成序列 · 504 bp · 观察滑窗曲线上的平台',
    fasta: toFasta('synthetic low-complexity repeat | 合成示例，非真实研究数据', buildRepeat()),
  },
  {
    id: 'messy',
    name: '含脏字符的输入',
    note: '合成序列 · 演示清洗与校验提示',
    fasta: buildMessy(),
  },
]
