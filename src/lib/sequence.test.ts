import { describe, expect, it } from 'vitest'
import {
  MAX_SEQUENCE_LENGTH,
  baseStats,
  chunkSequence,
  findMotif,
  gcWindows,
  parseSequence,
  reverseComplement,
  validateMotif,
} from './sequence'

describe('parseSequence', () => {
  it('reads a FASTA record and drops the header', () => {
    const result = parseSequence('>demo sequence\nACGT\nACGT\n')
    expect(result.sequence).toBe('ACGTACGT')
    expect(result.header).toBe('demo sequence')
    expect(result.records).toBe(1)
  })

  it('uppercases, ignores whitespace and line numbers, and reports invalid characters', () => {
    const result = parseSequence('  1 acgt 12\n3 ACGU\n')
    expect(result.sequence).toBe('ACGTACG')
    expect(result.invalid).toEqual([{ char: 'U', count: 1 }])
    expect(result.invalidTotal).toBe(1)
    expect(result.stripped).toBe(8)
  })

  it('keeps N and returns an empty sequence for empty input', () => {
    expect(parseSequence('ACNT').sequence).toBe('ACNT')
    expect(parseSequence('').sequence).toBe('')
    expect(parseSequence('').records).toBe(0)
  })

  it('handles multiple records by concatenating them in order', () => {
    const result = parseSequence('>a\nAC\n>b\nGT\n')
    expect(result.sequence).toBe('ACGT')
    expect(result.records).toBe(2)
    expect(result.header).toBe('a')
  })

  it('truncates sequences longer than the documented limit', () => {
    const result = parseSequence('A'.repeat(MAX_SEQUENCE_LENGTH + 25))
    expect(result.sequence.length).toBe(MAX_SEQUENCE_LENGTH)
    expect(result.truncated).toBe(true)
  })

  it('does not flag a sequence exactly at the limit', () => {
    const result = parseSequence('A'.repeat(MAX_SEQUENCE_LENGTH))
    expect(result.truncated).toBe(false)
  })
})

describe('baseStats', () => {
  it('computes GC over A/C/G/T only and excludes N', () => {
    const stats = baseStats('GGGCCCAAATTTNN')
    expect(stats.counts).toEqual({ A: 3, C: 3, G: 3, T: 3, N: 2 })
    expect(stats.gc).toBeCloseTo(50, 6)
    expect(stats.at).toBeCloseTo(50, 6)
    expect(stats.acgt).toBe(12)
  })

  it('returns zero GC when there are no A/C/G/T bases', () => {
    expect(baseStats('NNNN').gc).toBe(0)
    expect(baseStats('').gc).toBe(0)
  })
})

describe('gcWindows', () => {
  it('tiles the sequence from 0 with the requested step', () => {
    const windows = gcWindows('GGGCCCAAATTT', 3, 3)
    expect(windows.map((w) => [w.start, w.end, w.gc])).toEqual([
      [0, 3, 100],
      [3, 6, 100],
      [6, 9, 0],
      [9, 12, 0],
    ])
  })

  it('uses overlapping windows when the step is smaller than the window', () => {
    const windows = gcWindows('ACGTACGT', 4, 2)
    expect(windows.map((w) => w.start)).toEqual([0, 2, 4])
    expect(windows.every((w) => w.gc === 50)).toBe(true)
  })

  it('clamps a window larger than the sequence to a single window', () => {
    const windows = gcWindows('ACGT', 10, 5)
    expect(windows).toEqual([{ start: 0, end: 4, gc: 50, acgt: 4 }])
  })

  it('returns nothing for an empty sequence', () => {
    expect(gcWindows('', 10, 1)).toEqual([])
  })
})

describe('reverseComplement', () => {
  it('complements and reverses', () => {
    expect(reverseComplement('ACGT')).toBe('ACGT')
    expect(reverseComplement('AAACGT')).toBe('ACGTTT')
    expect(reverseComplement('ACGTN')).toBe('NACGT')
  })

  it('returns an empty string for empty input', () => {
    expect(reverseComplement('')).toBe('')
  })
})

describe('findMotif', () => {
  it('finds overlapping matches', () => {
    const matches = findMotif('AAAA', 'AA', { overlapping: true, bothStrands: false })
    expect(matches.map((m) => [m.start, m.end])).toEqual([
      [0, 2],
      [1, 3],
      [2, 4],
    ])
  })

  it('skips overlapping matches when asked', () => {
    const matches = findMotif('AAAA', 'AA', { overlapping: false, bothStrands: false })
    expect(matches.map((m) => m.start)).toEqual([0, 2])
  })

  it('reports minus-strand hits on forward coordinates', () => {
    const matches = findMotif('AAACGT', 'ACG', { overlapping: false, bothStrands: true })
    expect(matches).toEqual([
      { start: 2, end: 5, strand: '+' },
      { start: 3, end: 6, strand: '-' },
    ])
    expect(reverseComplement('AAACGT'.slice(3, 6))).toBe('ACG')
  })

  it('finds both strands when the motif occurs on each', () => {
    const matches = findMotif('ACGTACGT', 'ACGT', { overlapping: false, bothStrands: true })
    expect(matches).toEqual([
      { start: 0, end: 4, strand: '+' },
      { start: 0, end: 4, strand: '-' },
      { start: 4, end: 8, strand: '+' },
      { start: 4, end: 8, strand: '-' },
    ])
  })

  it('ignores case and surrounding whitespace in the motif', () => {
    expect(findMotif('acgtacgt', '  acgt ', { overlapping: false, bothStrands: false })).toEqual([
      { start: 0, end: 4, strand: '+' },
      { start: 4, end: 8, strand: '+' },
    ])
  })

  it('returns nothing for an invalid or too-long motif', () => {
    expect(findMotif('ACGT', 'AX', { overlapping: true, bothStrands: false })).toEqual([])
    expect(findMotif('ACGT', '', { overlapping: true, bothStrands: false })).toEqual([])
  })
})

describe('validateMotif', () => {
  it('accepts plain A/C/G/T and rejects everything else', () => {
    expect(validateMotif('acgt')).toBeNull()
    expect(validateMotif('')).not.toBeNull()
    expect(validateMotif('ACGU')).toContain('U')
    expect(validateMotif('A'.repeat(51))).not.toBeNull()
  })
})

describe('chunkSequence', () => {
  it('splits into fixed-width rows and keeps offsets', () => {
    expect(chunkSequence('ACGTACG', 3)).toEqual([
      { offset: 0, text: 'ACG' },
      { offset: 3, text: 'TAC' },
      { offset: 6, text: 'G' },
    ])
  })
})
