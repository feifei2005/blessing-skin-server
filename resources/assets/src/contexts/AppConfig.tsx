import React, { createContext, useContext, useState, useEffect } from 'react'
import { loadI18n } from '@/scripts/i18n'
import { tryRenderEmailVerification } from '@/scripts/emailVerification'

export interface AppConfig {
  baseUrl: string
  siteName: string
  locale: string
  version: string
  siteDescription: string
  homePicUrl: string
  extra: Record<string, any>
  setLocale?: (locale: string) => void
}

const defaultConfig: AppConfig = {
  baseUrl: (window as any).__API_BASE__ || process.env.REACT_APP_API_BASE || '',
  siteName: '',
  locale: navigator.language.replace(/-/g, '_') || 'en',
  version: '',
  siteDescription: '',
  homePicUrl: '',
  extra: (window as any).blessing?.extra || {},
}

const AppConfigContext = createContext<AppConfig>(defaultConfig)

export function useAppConfig() {
  return useContext(AppConfigContext)
}

export function useBlessingExtra<T>(key: string, defaultValue?: T): T {
  const { extra } = useAppConfig()
  const windowExtra = (window as any).blessing?.extra?.[key]
  const [value, setValue] = useState<T>(
    (extra[key] as T) ?? (windowExtra as T) ?? (defaultValue as T),
  )

  useEffect(() => {
    if (extra[key] !== undefined) {
      setValue(extra[key] as T)
    }
  }, [key, extra])

  return value
}

interface AppConfigProviderProps {
  config?: Partial<AppConfig>
  children: React.ReactNode
}

export function AppConfigProvider({
  config,
  children,
}: AppConfigProviderProps) {
  const [appConfig, setAppConfig] = useState<AppConfig>({
    ...defaultConfig,
    ...config,
  })
  const [ready, setReady] = useState(!!config)

  useEffect(() => {
    if (config) {
      setAppConfig((prev) => ({ ...prev, ...config }))
      setReady(true)
      return
    }

    // 优先使用运行时 config.json 中的 apiBase，其次使用编译时环境变量
    const baseUrl =
      (window as any).__API_BASE__ || process.env.REACT_APP_API_BASE || ''
    const locale = navigator.language.replace(/-/g, '_') || 'en'

    Promise.all([
      fetch(`${baseUrl}/api/site-config`).then((r) =>
        r.ok ? r.json().catch(() => ({})) : {},
      ),
      loadI18n(locale),
    ])
      .then(([data]) => {
        if (data && typeof data === 'object') {
          setAppConfig((prev) => {
            const next = { ...prev, ...data }
            if (next.extra) {
              ;(window as any).blessing.extra = next.extra
            }
            ;(window as any).blessing.base_url =
              next.baseUrl ||
              (window as any).__API_BASE__ ||
              process.env.REACT_APP_API_BASE ||
              ''
            if (next.siteName) {
              document.title = next.siteName
            }
            return next
          })
          // 副作用应在 state 更新之外执行
          tryRenderEmailVerification()
        }
      })
      .catch((e) => {
        console.warn('[AppConfig] Failed to load site config:', e)
      })
      .finally(() => {
        setReady(true)
      })
  }, [config])

  if (!ready) {
    return null
  }

  const changeLocale = (locale: string) => {
    setAppConfig((prev) => ({ ...prev, locale }))
  }

  return (
    <AppConfigContext.Provider
      value={{ ...appConfig, setLocale: changeLocale }}
    >
      {children}
    </AppConfigContext.Provider>
  )
}
