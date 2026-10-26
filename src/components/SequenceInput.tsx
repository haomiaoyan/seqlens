import { useRef } from 'react'
import { EXAMPLES } from '../data/examples'
import { MAX_SEQUENCE_LENGTH, formatInteger, type ParseResult } from '../lib/sequence'

interface Props {
  raw: string
  onRawChange: (value: string) => void
  parsed: ParseResult
  onLoadExample: (id: string) => void
  onClear: () => void
}

export function SequenceInput({ raw, onRawChange, parsed, onLoadExample, onClear }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      window.alert('文件超过 8 MB。首版建议先截取一小段序列再试。')
      return
    }
    const text = await file.text()
    onRawChange(text)
  }

  return (
    <section className="panel panel--input" aria-labelledby="input-title">
      <div className="panel__head">
        <h2 id="input-title">
          <span className="step">01</span> 输入序列
        </h2>
        <div className="panel__head-actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => fileRef.current?.click()}
          >
            打开文件
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
            清空
          </button>
        </div>
      </div>

      {/* The visible "打开文件" button triggers this input, so it must not be a
          separate tab stop — a focusable but invisible control is unreachable
          for sighted keyboard users. It still needs a name for screen readers. */}
      <input
        ref={fileRef}
        type="file"
        accept=".fa,.fasta,.fna,.txt,text/plain"
        className="visually-hidden"
        aria-label="选择序列文件"
        tabIndex={-1}
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <label className="field">
        <span className="field__label">粘贴 FASTA 或纯序列</span>
        <textarea
          className="textarea"
          value={raw}
          spellCheck={false}
          placeholder={'>my-sequence\nACGTACGTACGT…'}
          onChange={(event) => onRawChange(event.target.value)}
        />
      </label>

      <div className="examples" role="group" aria-label="示例序列">
        <span className="examples__label">示例</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            className="chip"
            onClick={() => onLoadExample(example.id)}
            title={example.note}
          >
            {example.name}
          </button>
        ))}
      </div>

      <ul className="parse-report">
        <li>
          <span className="parse-report__k">已解析</span>
          <span className="parse-report__v">{formatInteger(parsed.sequence.length)} bp</span>
        </li>
        <li>
          <span className="parse-report__k">记录数</span>
          <span className="parse-report__v">{parsed.records}</span>
        </li>
        <li>
          <span className="parse-report__k">忽略字符</span>
          <span className="parse-report__v">{formatInteger(parsed.stripped)}</span>
        </li>
      </ul>

      {parsed.header && <p className="parse-header">header：{parsed.header}</p>}

      {parsed.invalidTotal > 0 && (
        <p className="notice notice--warn">
          发现 {formatInteger(parsed.invalidTotal)} 个非 A/C/G/T/N 字符，已忽略：
          {parsed.invalid
            .slice(0, 6)
            .map((item) => `${item.char}×${item.count}`)
            .join('、')}
        </p>
      )}

      {parsed.truncated && (
        <p className="notice notice--warn">
          序列超过 {formatInteger(MAX_SEQUENCE_LENGTH)} bp，已截断用于首版演示。
        </p>
      )}

      {parsed.sequence.length === 0 && raw.trim().length > 0 && (
        <p className="notice notice--warn">没有解析到有效碱基，请检查输入内容。</p>
      )}
    </section>
  )
}
