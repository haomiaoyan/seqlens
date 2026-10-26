import { APP_NAME, GITHUB_URL } from '../config'

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href="#top" aria-label={`${APP_NAME} 首页`}>
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <path
                d="M10 5c0 6.5 12 8.5 12 15M22 5c0 6.5-12 8.5-12 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M12.2 9.6h7.6M11.4 15h9.2M12.2 20.4h7.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity=".55"
              />
            </svg>
          </span>
          <span className="brand__text">
            <strong>{APP_NAME}</strong>
            <small>DNA Sequence Explorer</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="主导航">
          <a href="#workbench">工作台</a>
          <a href="#method">方法说明</a>
          <a href="#limits">使用边界</a>
        </nav>

        <div className="site-header__actions">
          <span className="pill pill--ghost" title="所有计算都在你的浏览器内完成">
            <span className="dot" aria-hidden="true" /> 本地计算
          </span>
          <a className="btn btn--ghost btn--sm" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}
