/**
 * Core sequence analysis for SeqLens.
 *
 * Conventions used everywhere in this file and in the UI:
 *  - All coordinates are 0-based and half-open: [start, end).
 *  - Only A, C, G, T and N are accepted. N never counts as a GC base.
 *  - GC content is (G + C) / (A + C + G + T), i.e. N is excluded from the denominator.
 */

export const MAX_SEQUENCE_LENGTH = 10000
export const MAX_MOTIF_LENGTH = 50

export const ALLOWED_BASES = 'ACGTN'

export interface InvalidChar {
  char: string
  count: number
}

export interface ParseResult {
  sequence: string
  header: string | null
  records: number
  /** Characters dropped because they are not A/C/G/T/N. */
  invalid: InvalidChar[]
  invalidTotal: number
  /** Whitespace, digits and line numbers removed while cleaning. */
  stripped: number
  truncated: boolean
}

/** Parses a raw FASTA / plain sequence paste into a cleaned uppercase sequence. */
export function parseSequence(raw: string): ParseResult {
  const lines = raw.split(/\r\n|\r|\n/)
  let header: string | null = null
  let records = 0
  let body = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('>')) {
      records += 1
      if (header === null) header = trimmed.slice(1).trim()
      continue
    }
    if (trimmed.startsWith(';')) continue // legacy FASTA comment line
    body += trimmed
  }

  let stripped = 0
  const invalidCounts = new Map<string, number>()
  let cleaned = ''

  for (const rawChar of body) {
    const char = rawChar.toUpperCase()
    if (char === ' ' || char === '\t' || char === '\u00a0' || /[0-9]/.test(char)) {
      stripped += 1
      continue
    }
    if (ALLOWED_BASES.includes(char)) {
      cleaned += char
      continue
    }
    stripped += 1
    invalidCounts.set(char, (invalidCounts.get(char) ?? 0) + 1)
  }

  const truncated = cleaned.length > MAX_SEQUENCE_LENGTH
  if (truncated) cleaned = cleaned.slice(0, MAX_SEQUENCE_LENGTH)

  const invalid = [...invalidCounts.entries()]
    .map(([char, count]) => ({ char, count }))
    .sort((a, b) => b.count - a.count)

  return {
    sequence: cleaned,
    header,
    records,
    invalid,
    invalidTotal: invalid.reduce((sum, item) => sum + item.count, 0),
    stripped,
    truncated,
  }
}

export interface BaseStats {
  length: number
  counts: Record<'A' | 'C' | 'G' | 'T' | 'N', number>
  /** GC percentage over A/C/G/T only. 0 when there are no such bases. */
  gc: number
  /** AT percentage over A/C/G/T only. */
  at: number
  acgt: number
}

export function baseStats(sequence: string): BaseStats {
  const counts = { A: 0, C: 0, G: 0, T: 0, N: 0 }
  for (const char of sequence) {
    if (char in counts) counts[char as keyof typeof counts] += 1
  }
  const acgt = counts.A + counts.C + counts.G + counts.T
  const gc = acgt === 0 ? 0 : ((counts.G + counts.C) / acgt) * 100
  return {
    length: sequence.length,
    counts,
    gc,
    at: acgt === 0 ? 0 : 100 - gc,
    acgt,
  }
}

export interface GcWindow {
  start: number
  end: number
  /** GC percentage inside the window, N excluded. */
  gc: number
  /** Number of A/C/G/T bases inside the window. */
  acgt: number
}

/**
 * Sliding-window GC content.
 * Windows start at 0 and advance by `step` while `start + window <= length`.
 * The window is clamped to the sequence length, so a window larger than the
 * sequence yields exactly one window covering the whole sequence.
 */
export function gcWindows(sequence: string, windowSize: number, step: number): GcWindow[] {
  const length = sequence.length
  if (length === 0) return []

  const size = Math.max(1, Math.min(Math.floor(windowSize) || 1, length))
  const stride = Math.max(1, Math.floor(step) || 1)

  const prefixGc = new Uint32Array(length + 1)
  const prefixAcgt = new Uint32Array(length + 1)
  for (let i = 0; i < length; i += 1) {
    const char = sequence[i]
    prefixGc[i + 1] = prefixGc[i] + (char === 'G' || char === 'C' ? 1 : 0)
    prefixAcgt[i + 1] = prefixAcgt[i] + (char === 'N' ? 0 : 1)
  }

  const windows: GcWindow[] = []
  for (let start = 0; start + size <= length; start += stride) {
    const end = start + size
    const gcCount = prefixGc[end] - prefixGc[start]
    const acgt = prefixAcgt[end] - prefixAcgt[start]
    windows.push({
      start,
      end,
      gc: acgt === 0 ? 0 : (gcCount / acgt) * 100,
      acgt,
    })
  }
  return windows
}

const COMPLEMENT: Record<string, string> = {
  A: 'T',
  C: 'G',
  G: 'C',
  T: 'A',
  N: 'N',
}

/** Reverse complement. Unknown characters are kept in place rather than guessed. */
export function reverseComplement(sequence: string): string {
  let out = ''
  for (let i = sequence.length - 1; i >= 0; i -= 1) {
    const char = sequence[i]
    out += COMPLEMENT[char] ?? char
  }
  return out
}

export type Strand = '+' | '-'

export interface MotifMatch {
  /** 0-based, inclusive. */
  start: number
  /** 0-based, exclusive. */
  end: number
  strand: Strand
}

export interface MotifOptions {
  overlapping: boolean
  bothStrands: boolean
}

/** Returns an error message for an unusable motif, or null when it is fine. */
export function validateMotif(motif: string): string | null {
  const cleaned = motif.trim().toUpperCase()
  if (!cleaned) return '请输入 motif'
  if (cleaned.length > MAX_MOTIF_LENGTH) return `motif 最多 ${MAX_MOTIF_LENGTH} 个碱基`
  const bad = [...new Set(cleaned.split(''))].filter((char) => !'ACGT'.includes(char))
  if (bad.length > 0) {
    return `motif 只支持 A / C / G / T，发现：${bad.join(' ')}`
  }
  return null
}

/**
 * Exact substring search. No IUPAC ambiguity codes, no mismatches.
 * For the minus strand the coordinates are still reported on the forward
 * sequence, so every match can be highlighted directly on the input.
 */
export function findMotif(sequence: string, motif: string, options: MotifOptions): MotifMatch[] {
  const query = motif.trim().toUpperCase()
  const target = sequence.toUpperCase()
  if (!query || validateMotif(query) !== null) return []
  if (target.length < query.length) return []

  const matches: MotifMatch[] = []

  const scan = (haystack: string, strand: Strand) => {
    let i = 0
    while (i + query.length <= haystack.length) {
      if (haystack.startsWith(query, i)) {
        if (strand === '+') {
          matches.push({ start: i, end: i + query.length, strand })
        } else {
          matches.push({
            start: sequence.length - (i + query.length),
            end: sequence.length - i,
            strand,
          })
        }
        // Skip past the whole hit so the next match cannot reuse these bases.
        i += options.overlapping ? 1 : query.length
      } else {
        i += 1
      }
    }
  }

  scan(target, '+')
  if (options.bothStrands) scan(reverseComplement(target), '-')

  matches.sort((a, b) => a.start - b.start || (a.strand === b.strand ? 0 : a.strand === '+' ? -1 : 1))
  return matches
}

/** Splits a sequence into fixed-width rows for display. */
export function chunkSequence(sequence: string, width: number): { offset: number; text: string }[] {
  const rows: { offset: number; text: string }[] = []
  for (let offset = 0; offset < sequence.length; offset += width) {
    rows.push({ offset, text: sequence.slice(offset, offset + width) })
  }
  return rows
}

export function formatInteger(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}
