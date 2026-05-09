import React, { createContext, useContext, useState, useEffect } from 'react'
import { loadI18n } from '@/scripts/i18n'
import { tryRenderEmailVerification } from '@/scripts/emailVerification'

export interface AppConfig {
  baseUrl: string
  siteName: string
  locale: string
  version: string
  extra: Record<string, any>
}

const defaultConfig: AppConfig = {
  baseUrl: (window as any).__API_BASE__ || process.env.REACT_APP_API_BASE || '',
  siteName: '',
  locale: navigator.language.split('-')[0] || 'en',
  version: '',
  extra: {},
}

const AppConfigContext = createContext<AppConfig>(defaultConfig)

export function useAppConfig() {
  return useContext(AppConfigContext)
}

export function useBlessingExtra<T>(key: string, defaultValue?: T): T {
  const { extra } = useAppConfig()
  const [value, setValue] = useState<T>(
    (extra[key] as T) ?? (defaultValue as T),
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

  useEffect(() => {
    if (config) {
      setAppConfig((prev) => ({ ...prev, ...config }))
      return
    }

    // 优先使用运行时 config.json 中的 apiBase，其次使用编译时环境变量
    const baseUrl =
      (window as any).__API_BASE__ || process.env.REACT_APP_API_BASE || ''
    const locale = navigator.language.split('-')[0] || 'en'

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
  }, [config])

  return (
    <AppConfigContext.Provider value={appConfig}>
      {children}
    </AppConfigContext.Provider>
  )
}
