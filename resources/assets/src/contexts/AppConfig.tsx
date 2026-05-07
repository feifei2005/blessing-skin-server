import React, { createContext, useContext, useState, useEffect } from 'react'
import { loadI18n } from '@/scripts/i18n'

export interface AppConfig {
  baseUrl: string
  siteName: string
  locale: string
  version: string
  extra: Record<string, any>
}

const defaultConfig: AppConfig = {
  baseUrl: process.env.REACT_APP_API_BASE || '',
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

    const baseUrl = process.env.REACT_APP_API_BASE || ''
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
              next.baseUrl || process.env.REACT_APP_API_BASE || ''
            if (next.siteName) {
              document.title = next.siteName
            }
            return next
          })
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
