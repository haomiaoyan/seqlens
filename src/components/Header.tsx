import { APP_NAME, GITHUB_URL } from '../config'
import { useTheme } from '../hooks/useTheme'

export function Header() {
  const { theme, toggle } = useTheme()
  const nextTheme = theme === 'light' ? '深色' : '浅色'

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href="#top" aria-label={`${APP_NAME} 首页`}>
          <span className="brand__text">
            <strong>{APP_NAME}</strong>
            <small>DNA SEQUENCE EXPLORER</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="主导航">
          <a href="#workbench">工作台</a>
          <a href="#method">方法说明</a>
          <a href="#limits">使用边界</a>
        </nav>

        <div className="site-header__actions">
          {/* 按钮文案显示的是切换目标，读屏文案写完整动作。 */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={`切换到${nextTheme}主题`}
          >
            {nextTheme}
          </button>
          <a className="btn btn--sm" href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}
