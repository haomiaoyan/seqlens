import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Named in the fallback so the user knows which part failed. */
  label?: string
  /**
   * Changing this value clears a previous error. Used to recover automatically
   * when the input that triggered the crash is replaced (e.g. a new sequence),
   * so the user is not stuck on the fallback until they reload.
   */
  resetKey?: unknown
  /** Compact variant for a single panel inside the workbench. */
  inline?: boolean
}

interface State {
  error: Error | null
}

/**
 * Contains a render failure to one part of the page. SeqLens has no backend,
 * so there is nowhere to report to: the error is logged to the console and the
 * user is offered a way to recover, rather than getting a blank white page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SeqLens] 渲染出错', error, info.componentStack)
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { label, inline } = this.props
    const title = label ? `${label}暂时无法显示` : '页面遇到了一个错误'

    return (
      <div
        className={inline ? 'error-boundary error-boundary--inline' : 'error-boundary'}
        role="alert"
      >
        <p className="error-boundary__title">
          <span className="error-boundary__mark" aria-hidden="true">
            !
          </span>
          {title}
        </p>
        <p className="error-boundary__body">
          其他部分仍可正常使用。你可以先重试；如果反复出现，刷新页面通常能恢复。
        </p>
        <pre className="error-boundary__detail mono">{error.message || String(error)}</pre>
        <div className="error-boundary__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={this.reset}>
            重试
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}
