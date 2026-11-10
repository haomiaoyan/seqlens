import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'seqlens.theme.v1'

function readInitialTheme(): Theme {
  // 主题选择与序列会话分开存：换主题不算动过数据，不该触发会话保存。
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage 被禁用时静默降级：本次会话用默认浅色，不持久化。
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

/**
 * 主题状态：浅色为默认（写在 tokens.css 的 :root），深色通过
 * documentElement 的 data-theme 属性切换，选择持久化到 localStorage。
 * 监听 storage 事件，让同源下另一个标签页的切换能实时同步过来。
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
        setTheme(event.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // 写不进去就算了：本次会话内主题仍然生效。
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
